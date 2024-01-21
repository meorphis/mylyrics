import { getImageColors } from "../../utility/image";
import { addMetadataToPassage } from "../../utility/recommendations";
import { 
  GROUP_TO_SENTIMENTS,
  SENTIMENT_TO_GROUP, VALID_SENTIMENTS_SET, getSentimentValue 
} from "../../utility/sentiments";
import { 
  Artist, LabeledPassage, Recommendation, RecommendationType,
  Song, IndexedSong, BundleInfo, SimplifiedSong
} from "../../utility/types";
import { uuidForPassage } from "../../utility/uuid";
import { getSearchClient } from "../aws";
import { getFirestoreDb } from "../firebase";
import { vectorizeSearchTerm } from "../llm/open_ai_integration";
import { getBoostsTerm } from "./common";
import { getScoredSentiments } from "./sentiments";

type SearchResult = {
    song: IndexedSong,
    passage: LabeledPassage,
    score: number,
    type: RecommendationType,
};

type RawSongResult = {
  _id: string,
  _score: number,
  _source: Omit<IndexedSong, keyof {id: string}> & {passages: LabeledPassage[]}
}

type RawPassageResult = {
  _id: string,
  _score: number,
  _source: {song: Song} & LabeledPassage
}

const NUMBER_OF_RECOMMENDATIONS_FOR_SECONDARY_SENTIMENTS = 5;
const NUMBER_OF_RECOMMENDATIONS_FOR_TOP_TRACKS = 10;
const MAX_NUMBER_OF_RECOMMENDATIONS_FOR_FEATURED_ARTIST = 10;
const MIN_NUMBER_OF_RECOMMENDATIONS_FOR_FEATURED_ARTIST = 5;

// *** PUBLIC INTERFACE ***
// function to get recommendations for a given user, across a few different categories:
// - featured artist: random passages from a song by one of the user's top artists
// - top passages: passages from the user's most frequent plays
// - sentiments: passages that match a given sentiment, generally that the user has
//    not seen in their recommendations before
export const getDailyPassageRecommendations = async (
  {
    userId,
    recentListens,
    topSpotifyArtists,
    topSpotifySongs,
    featuredArtistIdOptions,
    previousRecommendationSentiments,
  }:
  {
    userId: string,
    recentListens: Record<string, {songs?: string[]; artists?: string[];}>,
    topSpotifyArtists: Artist[],
    topSpotifySongs: SimplifiedSong[],
    featuredArtistIdOptions: string[],
    previousRecommendationSentiments: Record<string, string[]>,
  }
): Promise<{
  recommendations: Recommendation[],
  recommendationSentiments: string[],
  featuredArtist: {
    id: string,
    name: string,
    emoji: string,
  } | null,
}> => {
  const db = await getFirestoreDb();

  let featuredArtist: {
    id: string,
    name: string,
    emoji: string,
  } | null = null;
  
  let artistSearchResults: SearchResult[] = [];

  for (const potentialFeaturedArtistId of featuredArtistIdOptions) {
    const docSnap = await db.collection("artists").doc(potentialFeaturedArtistId).get()
    const data = docSnap.data();

    if ((data?.numIndexedSongs ?? 0) < MIN_NUMBER_OF_RECOMMENDATIONS_FOR_FEATURED_ARTIST) {
      console.log(`artist ${potentialFeaturedArtistId} has too few indexed songs`);
      continue;
    }

    const potentialFeaturedArtist = {
      id: potentialFeaturedArtistId,
      emoji: data && data.artistEmoji,
      name: data && data.artistName,
    }

    if (!potentialFeaturedArtist.emoji) {
      console.log(`no emoji found for artist ${potentialFeaturedArtistId}`)
      continue;
    }

    if (!potentialFeaturedArtist.name) {
      console.log(`no name found for artist ${potentialFeaturedArtistId}`)
      continue;
    }
    
    console.log(`looking for passages for artist ${potentialFeaturedArtist.name}`)

    // TODO: should be able to use ID here
    const results = await getSearchResultsForArtist({
      artistName: potentialFeaturedArtist.name,
    });

    // this should be covered by the numIndexedSongs check above, but let's double-check
    if (results.length >= MIN_NUMBER_OF_RECOMMENDATIONS_FOR_FEATURED_ARTIST) {
      featuredArtist = potentialFeaturedArtist;
      artistSearchResults = results;
      console.log(`found ${results.length} results for artist ${featuredArtist.name}`)
      break;
    } else {
      console.log(`only found ${results.length} results for artist ${potentialFeaturedArtist.name}`)
    }
  }

  const topPassageSearchResults = await getSearchResultsForTopPassages({
    userId,
    recentListens,
    topArtistNames: topSpotifyArtists.map((artist) => artist.name),
    topSpotifySongIds: topSpotifySongs.map((t) => t.id),
    excludeArtistName: featuredArtist?.name ?? null
  });
  console.log(`found ${topPassageSearchResults.length} top passages for user ${userId}`);

  const recommendationSentiments = await getRecommendationSentiments({
    userId,
    previousRecommendationSentiments,
    recentListens,
    excludeSongIds: [
      ...artistSearchResults.map((r) => r.song.id),
      ...topPassageSearchResults.map((r) => r.song.id),
    ]
  });

  console.log(
    `recommended sentiments for user ${userId}: ${JSON.stringify(recommendationSentiments)}`
  );

  const sentimentSearchResults = recommendationSentiments ? await getSearchResultsForSentiments(
    {
      userId,
      sentiments: recommendationSentiments,
      recentListens,
      excludeSongIds: [
        ...artistSearchResults.map((r) => r.song.id),
        ...topPassageSearchResults.map((r) => r.song.id),
      ]
    }
  ) : [];
  console.log(`found ${sentimentSearchResults.length} sentiment passages for user ${userId}`);

  return {
    recommendations: [
      ...parseSearchResults({
        results: topPassageSearchResults,
        getBundleInfos: (passage: LabeledPassage) => [
          {type: "top", group: "essentials", key: "top"},
          ...getSentimentBundleInfos(passage)
        ]
      }),
      ...(artistSearchResults ? parseSearchResults({
        results: artistSearchResults,
        getBundleInfos: (passage: LabeledPassage) => [{
          type: "artist",
          key: "artist",
          group: "featured",
          artist: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            name: featuredArtist!.name,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            emoji: featuredArtist!.emoji,
          }
        },
        ...getSentimentBundleInfos(passage)
        ]
      }) : []),
      ...parseSearchResults({
        results: sentimentSearchResults,
        getBundleInfos: getSentimentBundleInfos,
      }),
    ],
    recommendationSentiments: recommendationSentiments || [],
    featuredArtist,
  };
}

// looks up a particular passage by song name, artist name, and line numbers
export const lookupPassage = async (
  {songName, artistName, lineNumbers}:
  {songName: string, artistName: string, lineNumbers: {start: number, end: number}}
): Promise<Recommendation | null> => {
  const searchClient = getSearchClient();
  const query = {
    index: "song-lyric-songs",
    body: {
      "query": {
        "bool": {
          "filter": [
            {"match": {"name": songName}},
            {"match": {"primaryArtist.name": artistName}},
          ]
        }
      },
      "size": 1,
    }
  };
  const results = await searchClient.search(query);

  const {hits} = results.body.hits;
  if (hits.length === 0) {
    return null;
  }
  const {_source, _id} = hits[0];

  const song = {
    id: _id,
    ..._source
  };

  const passage: LabeledPassage = addMetadataToPassage({
    lyrics: song.lyrics.split("\n").slice(lineNumbers.start, lineNumbers.end).join("\n"),
    sentiments: [],
  });

  return parseSearchResults({
    results: [{
      song,
      passage,
      score: 0,
      type: "lookup"
    }],
    getBundleInfos: () => [],
  })[0];
}

// does a semantic (vector) search across a user's recent listens to find passages that
// are similar to a given term
export const getSemanticMatchesForTerm = async (
  {userId, term, limit}:
  { 
    userId: string,
    term: string,
    limit: number
  }
): Promise<Recommendation[]> => {
  const db = await getFirestoreDb();
  const recentListensSnap = await db.collection("user-recent-listens").doc(userId).get()
  const recentListens = recentListensSnap.data() || {};

  const searchClient = getSearchClient();
  const vector = await vectorizeSearchTerm({term});

  const songs = await getRecentSongs({recentListens});

  const query = {
    index: "song-lyric-passages",
    body: {
      "query": {
        "script_score": {
          "query": {
            "bool": {
              "filter": [                  
                {"terms": {"song.id": songs}},
                {
                  "range": {
                    "metadata.numEffectiveLines": {
                      "gt": 1
                    }
                  }
                }
              ]
            }
          },
          "script": {
            "lang": "knn",
            "source": "knn_score",
            "params": {
              "field": "lyricsVector",
              "query_value": vector,
              "space_type": "l2"
            }
          }
        }
      },
      "_source": {
        "excludes": ["lyricsVector"]
      },
      "size": limit,
    }
  };

  const results = await searchClient.search(query);

  // unpack search results
  const passages: {
    song: IndexedSong, passage: LabeledPassage, score: number
  }[] = results.body.hits.hits.map((hit: RawPassageResult) => {
    const {_score: score, _source: {song, ...passage}} = hit;
    return {
      song,
      passage: {
        ...passage,
        sentiments: passage.sentiments.filter((s) => VALID_SENTIMENTS_SET.has(s)),
      },
      score,
    }
  });

  const colors = await Promise.all(passages.map(async (passage) => {
    const {album} = passage.song;
    const {image} = album;
    return await getImageColors({url: image.url});
  }));

  return passages.map(({song, passage, score}, idx) => {
    return {
      lyrics: passage.lyrics,
      song: {
        id: song.id,
        album: {
          name: song.album.name,
          image: {
            url: song.album.image.url,
            colors: colors[idx],
          }
        },
        artists: song.artists.map((artist) => {
          return {
            id: artist.id,
            name: artist.name,
          }
        }),
        name: song.name,
        lyrics: song.lyrics,
      },
      bundleInfos: passage.sentiments.map((sentiment) => {
        return {
          type: "sentiment",
          key: sentiment,
          sentiment,
          group: SENTIMENT_TO_GROUP[sentiment],
          value: getSentimentValue(sentiment),
        }
      }),
      score,
      type: "semantic_search",
    }
  });
}

// *** PRIVATE HELPERS ***
// for a given user, we find the most relevant passages to show them for a given set of sentiments
// we do this by looking at their listening history - generally if a user has listened to
// a given song or artist more recently or frequently it will get a higher boost
const getSearchResultsForSentiments = async (
  {userId, sentiments, recentListens, excludeSongIds}:
  { 
    userId: string,
    sentiments: string[],
    recentListens: Record<string, {songs?: Array<string>, artists?: Array<string>} | undefined>,
    excludeSongIds?: string[],
  }
): Promise<SearchResult[]> => {
  const db = await getFirestoreDb();

  const [...impressionsSnaps] = await db.getAll(
    ...sentiments.map(s => db.collection("user-impressions").doc(`${userId}-${s}`))
  );

  const impressions = impressionsSnaps.map((snap) => snap.data()?.value || []).flat();

  const {boosts, maxBoost} = getBoostsTerm({recentListens});

  // we run our ES query in a loop - the query has a constraint such that all results
  // will match exactly one of the target sentiments, but we have some additional constraints
  // - each sentiment should be represented at least N times (see constants at the top of the file)
  // - each artist should be represented at most 3 times
  // to satisfy these constraints, we run the query multiple times, each time narrowing the
  // constraints to exclude artists, songs, and sentiments that have already been used sufficiently
  const allResults: SearchResult[] = [];
  let filteredResults: SearchResult[] = [];
  
  let loopData = {
    iterations: 0,
    numResultsStillNeeded: sentiments.length * NUMBER_OF_RECOMMENDATIONS_FOR_SECONDARY_SENTIMENTS,
    depletedSongIds: excludeSongIds ?? [] as string[],
    depletedArtistIds: [] as string[],
    remainingSentiments: sentiments,
  }

  while (loopData.numResultsStillNeeded > 0 && loopData.iterations < 5) {
    const additionalResults = await getRecommendationsForSentimentsInner({
      boosts,
      maxBoost,
      impressions,
      sentiments: loopData.remainingSentiments,
      // fetch twice as many as we need since we'll likely filter some out
      limit: 2 * loopData.numResultsStillNeeded,
      excludeSongIds: loopData.depletedSongIds,
      excludeArtistIds: loopData.depletedArtistIds
    });

    if (additionalResults.length === 0) {
      console.log(`stopped finding results after ${loopData.iterations} iterations`);
      break;
    }

    allResults.push(...additionalResults);

    const {newResults, newLoopData} = filterResults({
      results: allResults,
      sentiments,
    })

    filteredResults = newResults;

    loopData = {
      ...newLoopData,
      iterations: loopData.iterations + 1,
    }
  }

  // sort by score
  return filteredResults;
}

// get a random set of passages for a given artist
const getSearchResultsForArtist = async (
  {artistName}:
  {
    artistName: string
  }
): Promise<SearchResult[]> => {
  const searchClient = getSearchClient();
  const query = {
    index: "song-lyric-songs",
    body: {
      "query": {
        "bool": {
          "must": [
            {
              "function_score": {
                "query": {
                  "match": {
                    "primaryArtist.name": artistName
                  }
                },
                "functions": [
                  {
                    "random_score": {}
                  }
                ]
              }
            }
          ],
        }
      },
      "size": MAX_NUMBER_OF_RECOMMENDATIONS_FOR_FEATURED_ARTIST,
    }
  }
  const results = await searchClient.search(query);

  console.log(`query took ${results.body.took}ms`);

  return parseRawSongResults({
    results: results.body.hits.hits,
    choosePassageFn: (_, passages) => passages[Math.floor(Math.random() * passages.length)],
    type: "artist",
  }).map((r) => (
    // the score from the query is random, so we replace it with the popularity score
    {...r, score: r.song.popularity}
  ));
}

// get the top passages to recommend to a user, regardless of sentiment
// - we look at the user's recent listens to determine which songs to boost, giving
//    strong preference to very recent listens
// - we apply a penalty if the song was very recently shown to the user, but we
//    are much more tolerant of repeats here than we are in getRecommendationsForSentiments
const getSearchResultsForTopPassages = async (
  {userId, recentListens, topArtistNames, topSpotifySongIds, excludeArtistName}: {
    userId: string,
    recentListens: Record<string, {songs?: string[]; artists?: string[];}>,
    topArtistNames: string[],
    topSpotifySongIds: string[],
    excludeArtistName: string | null
  }
): Promise<SearchResult[]> => {
  const db = await getFirestoreDb();
  const searchClient = getSearchClient();
  const [songImpressionsSnap, passageImpressionsSnap] = await db.getAll(
    db.collection("user-impressions").doc(`${userId}-top`),
    db.collection("user-impressions").doc(`${userId}-top-passages`)
  );
  const impressionsSet = new Set((songImpressionsSnap.data()?.value || []).slice(0, 50));
  const passageImpressionsByLowestIndex = (
    (passageImpressionsSnap.data()?.value || []) as string[]).reduce(
    (acc: {[key: string]: number}, passageId, index) => {
      if (!(passageId in acc)) {
        acc[passageId] = index;
      }
      return acc;
    }, {}
  );

  const periodToPoints: {[key: string]: number} = {
    yesterday: 1024,
    "daysago-2": 256,
    "daysago-3": 128,
    "daysago-4": 64,
    "daysago-5": 32,
    "daysago-6": 16,
    "daysago-7": 8,
    "daysago-8": 4,
    "longerAgo": 1,
  }

  // large boost for top spotify songs if they are provided
  const songToPoints: {[key: string]: number} = Object.fromEntries(
    topSpotifySongIds.map((songId, index) => {
      return [songId, index < 10 ? 8192 : 2048];
    })
  );

  Object.entries(recentListens).forEach(([period, {songs}]) => {
    (songs ?? []).forEach((song) => {
      let reward = periodToPoints[period];

      if (reward === undefined) {
        return;
      }

      if (impressionsSet.has(song)) {
        reward = Math.ceil(reward / 8);
      }
      songToPoints[song] = (songToPoints[song] || 0) + reward;
    });
  })
  const normalizedSongsToPoints = Object.entries(songToPoints).map(([song, points]) => {
    const floorLogRoot2Points = Math.max(Math.floor(2 * Math.log2(points)), 0);
    const normalizedPoints = Math.pow(2, floorLogRoot2Points);
    return {song, points: normalizedPoints};
  })
  const groupedSongs = normalizedSongsToPoints.reduce((acc, {song, points}) => {
    if (!acc[points]) {
      acc[points] = [];
    }
    acc[points].push(song);
    return acc;
  }, {} as {[key: number]: string[]});
  const songBoosts = Object.entries(groupedSongs).map(([points, songs]) => {
    return {
      "filter": {
        "ids": {
          "values": songs
        }
      },
      "weight": parseInt(points),
    }
  });
  const boostArtistNames = topArtistNames.filter(
    (artistName) => artistName !== excludeArtistName
  );

  // small artist boost - if the user has recent listens, this is essentially
  // just a tie breaker since the song boosts get much larger
  const artistBoosts = boostArtistNames.map((artistName, idx) => {
    return {
      "filter": {
        "match": {
          "primaryArtist.name": artistName
        }
      },
      "weight": boostArtistNames.length - idx
    }
  })
  const query = {
    index: "song-lyric-songs",
    body: {
      "query": {
        "function_score": {
          ...(
            excludeArtistName ? {"query": {
              "bool": {
                "must_not": [
                  {
                    "match": {
                      "primaryArtist.name": excludeArtistName
                    }
                  }
                ]
              }
            }} : 
              {}
          ),
          "functions": [...songBoosts, ...artistBoosts],
          "score_mode": "sum",
          "boost_mode": "replace",
        }
      },
      "size": 50,
    }
  }
  const queryOutput = await searchClient.search(query);

  console.log(`query took ${queryOutput.body.took}ms`);

  const results = parseRawSongResults({
    results: queryOutput.body.hits.hits,
    choosePassageFn: (song, passages) => {
      const passageImpressionIndexes = passages.map((p) => {
        return {
          passage: p,
          index: passageImpressionsByLowestIndex[uuidForPassage({
            lyrics: p.lyrics,
            songName: song.name,
            artistName: song.primaryArtist.name,
          })]
        }
      })

      const unseenPassages = passageImpressionIndexes.filter((p) => p.index === undefined);

      if (unseenPassages.length > 0) {
        // return a random unseen passage
        return unseenPassages[Math.floor(Math.random() * unseenPassages.length)].passage;
      } else {
        // find the two least-recently seen passsages (highest indexes) and return a random one
        const sortedPassages = passageImpressionIndexes.sort((a, b) => {
          return (b.index || 0) - (a.index || 0);
        });
        return sortedPassages[Math.floor(Math.random() * 2)].passage;
      }
    },
    type: "top",
  });

  // of the 50 results, return 10 trying to capture a diversity of artists
  const numUniqueArtists = new Set(results.map((result) => result.song.primaryArtist.id)).size;
  const maxNumResultsPerArtist = Math.ceil(
    NUMBER_OF_RECOMMENDATIONS_FOR_TOP_TRACKS / numUniqueArtists
  );
  const artistToNumResults = new Map();
  return results.reduce((acc, result) => {
    const {primaryArtist} = result.song;
    const numResultsForArtist = artistToNumResults.get(primaryArtist.id) || 0;
    if (numResultsForArtist < maxNumResultsPerArtist) {
      artistToNumResults.set(primaryArtist.id, numResultsForArtist + 1);
      acc.push(result);
    }
    return acc;
  }, [] as SearchResult[]).slice(0, NUMBER_OF_RECOMMENDATIONS_FOR_TOP_TRACKS);
}

const parseSearchResults = (
  {results, getBundleInfos}:
  {results: SearchResult[], getBundleInfos: (p: LabeledPassage) => BundleInfo[]}
): Recommendation[] => {
  // this order only currently comes into play when we are generating notifications - in the UI
  // these categories currently are not shown together in the same views
  const typeOrder: RecommendationType[] = 
    ["top", "artist", "sentiment", "lookup", "semantic_search"];

  const sortedFilteredResults = results.sort((a, b) => {
    const typeOrderDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    if (typeOrderDiff !== 0) {
      return typeOrderDiff;
    }

    return b.score - a.score
  });

  return sortedFilteredResults.map(({song, passage, score, type}) => {
    return {
      lyrics: passage.lyrics,
      song: {
        id: song.id,
        album: {
          name: song.album.name,
          image: {
            url: song.album.image.url,
            colors: song.album.image.colors,
          }
        },
        artists: song.artists.map((artist) => {
          return {
            id: artist.id,
            name: artist.name,
          }
        }),
        name: song.name,
        lyrics: song.lyrics,
      },
      bundleInfos: getBundleInfos(passage),
      score,
      type,
    }
  });
}

const getRecentSongs = async (
  {recentListens} : 
  {
    recentListens: Record<string, {songs?: Array<string>, artists?: Array<string>} | undefined>,
  }
) => {
  const songsYesterday = recentListens.yesterday?.songs || [];
  const songsLastWeek = [2, 3, 4, 5, 6, 7, 8].map((daysAgo) => {
    return recentListens[`daysago-${daysAgo}`]?.songs || [];
  }).flat();
  const songsLongerAgo = recentListens.longerAgo?.songs || [];
  
  const songs = [
    ...songsYesterday,
    ...songsLastWeek,
    ...songsLongerAgo,
  ];

  return songs;
}

const getRecommendationsForSentimentsInner = async (
  {boosts, maxBoost, impressions, sentiments, limit, excludeSongIds, excludeArtistIds}: 
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boosts: any[],
    maxBoost: number,
    impressions: string[],
    sentiments: string[],
    limit: number,
    excludeSongIds: string[],
    excludeArtistIds: string[],
  }
) => {
  console.log("getting search client");

  const searchClient = getSearchClient();

  const query = {
    index: "song-lyric-songs",
    body: {
      query: {
        "function_score": {
          "query": {
            "function_score": {
              "query": {
                "bool": {
                  "must_not": [
                    // do not return songs that the user has already seen passages from with this
                    // sentiment attached (either currently or before)
                    {"ids": {"values": excludeSongIds}},
    
                    // if we have a current recommendation for this artist for this sentiment, don't
                    // get more
                    {"terms": {"primaryArtist.id": excludeArtistIds}},
                  ],
    
                  // only return passages that do have the specified sentiment
                  "filter": {"terms": {"passageSentiments": sentiments}},
                }
              },
              "functions": boosts,
              "score_mode": "sum",
              "boost_mode": "replace",
              // must have at least one recency/frequency boost OR a popularity of at least
              // 80 (log base 10 of 80 is ~1.9)
              "min_score": 1.9,
            }
          },
          "functions": [
            {
              "filter": {
                "bool": {
                  "must_not": {
                    "ids": {
                      "values": impressions || []
                    }
                  }
                }
              },
              // boost all candidates without an impression above all candidates with an
              // impression
              "weight": maxBoost,
            }
          ],
          "score_mode": "sum",
          "boost_mode": "sum",
        },
      },
      "size": limit,
    }
  };

  console.log("running opensearch query")

  const results = await searchClient.search(query);

  console.log(`query took ${results.body.took}ms`);

  return parseRawSongResults({
    results: results.body.hits.hits,
    choosePassageFn: (_, passages) => selectOptimalPassage({passages, sentiments}),
    type: "sentiment",
  });
}

const filterResults = (
  {results, sentiments}:
  {
    results: SearchResult[],
    sentiments: string[],
  }
) => {
  const artistOccuranceMap = new Map();
  const sentimentOccuranceMap = new Map();

  const numEntriesStillNeeded = (sentiment: string) => {
    if (!sentiments.includes(sentiment)) {
      return 0;
    }

    const sentimentOccurances = sentimentOccuranceMap.get(sentiment) ?? 0;
    // we need at least 5 passages per sentiment
    return Math.max(
      0, NUMBER_OF_RECOMMENDATIONS_FOR_SECONDARY_SENTIMENTS - sentimentOccurances)
  }

  const artistIsDepleted = (artistId: string) => {
    const artistOccurances = artistOccuranceMap.get(artistId) ?? 0;
    // do not allow more than 3 passages from a given artist
    return artistOccurances >= 3;
  }

  const filteredResults = results.filter((r) => {
    const shouldAdd = (
      !artistIsDepleted(r.song.primaryArtist.id) && r.passage.sentiments.some((s) => {
        return numEntriesStillNeeded(s) > 0;
      })
    );
    if (shouldAdd) {
      const {song, passage} = r;
      artistOccuranceMap.set(
        song.primaryArtist.id, (artistOccuranceMap.get(song.primaryArtist.id) ?? 0) + 1
      );
      passage.sentiments.forEach((s) => {
        if (sentiments.includes(s)) {
          sentimentOccuranceMap.set(s, (sentimentOccuranceMap.get(s) ?? 0) + 1);
        }
      }); 
    }
    return shouldAdd;
  });

  console.log(
    `sentiment occurances so far ${JSON.stringify(Array.from(sentimentOccuranceMap.entries()))}`
  );

  return {
    newResults: filteredResults,
    newLoopData: {
      numResultsStillNeeded: sentiments.reduce((acc, sentiment) => {
        return acc + numEntriesStillNeeded(sentiment);
      }, 0),
      depletedSongIds: results.map((r) => r.song.id),
      depletedArtistIds: Array.from(artistOccuranceMap.keys()).filter(artistIsDepleted),
      remainingSentiments: sentiments.filter((s) => numEntriesStillNeeded(s) > 0),
    }
  }
};

const selectOptimalPassage = ((
  {passages, sentiments}: {passages: LabeledPassage[], sentiments: string[]}
) => {
  const sentimentsSet = new Set(sentiments);

  // generally prefer passages with a "medium" number of lines
  const sortedOptimalNumEffectiveLines = [6, 5, 4, 7, 8, 3, 2, 1];

  // select the passage with the most optimal number of effective lines
  return passages.sort((a, b) => {
    // if a passage doesn't match one of the target sentiments, it loses by default
    if (!a.sentiments.some((s) => sentimentsSet.has(s))) {
      return 1;
    }
    if (!b.sentiments.some((s) => sentimentsSet.has(s))) {
      return -1;
    }

    const aIdx = sortedOptimalNumEffectiveLines.indexOf(
      a.metadata.numEffectiveLines
    );
    const bIdx = sortedOptimalNumEffectiveLines.indexOf(
      b.metadata.numEffectiveLines
    );
    if (aIdx === -1 && bIdx === -1) {
      // fewer is better if both are > 8
      return a.metadata.numEffectiveLines - b.metadata.numEffectiveLines;
    }
    if (aIdx === -1) {
      return 1;
    }
    if (bIdx === -1) {
      return -1;
    }
    return aIdx - bIdx;
  })[0];
});

const parseRawSongResults = (
  {results, choosePassageFn, type}:
  {
    results: RawSongResult[],
    choosePassageFn: (song: Omit<Song, "id">, passages: LabeledPassage[]) => LabeledPassage,
    type: RecommendationType,
  }
): SearchResult[] => {
  return results.filter((r) => r._source.passages.length > 0).map(
    (result) => {
      const {_id: songId, _score: score, _source: {passages, ...song}} = result;
      // we have no preference for which passage to show, so just pick one at random
      const passage = choosePassageFn(song, passages);
      return {
        song: {
          id: songId,
          ...song,
        },
        passage: {
          ...passage,
          sentiments: passage.sentiments.filter((s) => VALID_SENTIMENTS_SET.has(s)),
        },
        score,
        type,
      }
    });
}

// gets a list of sentiments that are highly represented in the user's recent listening activity
// we generally enforce the following constraints (unless we don't have enough eligible recs):
// - we will recommend sentiments from three groups, with two or three sentiments each (three if
//    possible)
// - at least two of these groups will be "non-negative", meaning at least two of their sentiments
//    are positive or mixed
// - we weigh each group according to the sum of the squares of the scores of its eligible
//    sentiments with a downrank factor for groups that have been recommended recently
const getRecommendationSentiments = async (
  {userId, previousRecommendationSentiments, recentListens, excludeSongIds} : 
  {
    userId: string,
    previousRecommendationSentiments?: Record<string, string[]>
    recentListens: Record<string, {songs?: Array<string>, artists?: Array<string>} | undefined>,
    excludeSongIds?: string[],
  },
): Promise<string[] | null> => {
  const scoredSentiments = await getScoredSentiments({userId, recentListens, excludeSongIds});

  if (scoredSentiments.length === 0) {
    console.log(`no scored sentiments for user ${userId}`);
    return null;
  }

  // first, find the constraining minimum rec count per group to use such that we will
  // definitely be able to find at least two non-negative groups and three groups in total to
  // recommend (though if minCountToUse ends up at zero, it means that we won't be able to fulfill
  // these constrains and we'll just recommend whatever we can)
  let minCountToUse = 5;
  let eligibleGroups = Object.keys(GROUP_TO_SENTIMENTS);
  let eligibleNonNegativeGroups = eligibleGroups.filter((group) => {
    return GROUP_TO_SENTIMENTS[group].filter((sentiment) => {
      return getSentimentValue(sentiment) !== "negative";
    }).length >= 2;
  });
  while (minCountToUse > 0) {
    const {nonNegativeOnly, all} = 
      groupsWithAtLeastTwoEligibleSentiments({
        scoredSentiments,
        minCount: minCountToUse,
      });
    if (nonNegativeOnly.length >= 2 && all.length >= 3) {
      eligibleNonNegativeGroups = nonNegativeOnly;
      eligibleGroups = all;
      break;
    }
    minCountToUse--;
  }

  const eligibleGroupsSet = new Set(eligibleGroups);
  const eligibleNonNegativeGroupsSet = new Set(eligibleNonNegativeGroups);

  // get group scores for eligible groups
  const groupScores = scoredSentiments.reduce((acc, {sentiment, score}) => {
    if (!eligibleGroupsSet.has(SENTIMENT_TO_GROUP[sentiment])) {
      return acc;
    }

    const group = SENTIMENT_TO_GROUP[sentiment];
    acc[group] = (acc[group] || 0) + score * score;
    return acc;
  }, {} as Record<string, number>)

  // downrank groups that have been recommended recently
  if (previousRecommendationSentiments) {
    const previousGroups = Object.keys(previousRecommendationSentiments);

    previousGroups.forEach((group) => {
      groupScores[group] = (groupScores[group] || 0) / 4;
    });
  }

  let groups = multiWeightedRandomChoice(groupScores, 3);

  console.log(JSON.stringify(scoredSentiments, null, 2), JSON.stringify(eligibleGroups, null, 2));
  let negativeGroups = groups.filter(g => !eligibleNonNegativeGroupsSet.has(g));

  // if we got too many negative groups, replace them
  if (negativeGroups.length > 1) {
    const remainingNonNegativeGroupScores = Object.fromEntries(Object.entries(groupScores).filter(
      g => !eligibleNonNegativeGroupsSet.has(g[0]) && !groups.includes(g[0])
    ))

    groups = [
      ...groups.filter(g => eligibleNonNegativeGroupsSet.has(g)),
      ...multiWeightedRandomChoice(
        remainingNonNegativeGroupScores,
        Math.min(negativeGroups.length - 1, Object.keys(remainingNonNegativeGroupScores).length)
      ),
      negativeGroups[0],
    ]
  }

  // "allow" the most negative group to be negative, even if it could be a non-negative group, to
  // avoid overdoing the positivity-washing
  if (negativeGroups.length === 0) {
    groups.sort((g) => GROUP_TO_SENTIMENTS[g].filter(
      s => getSentimentValue(s) === "negative"
    ).length);
    negativeGroups = [groups[-1]];
  }

  // now, for each group select the sentiments
  return groups.map((group) => {
    const groupSentiments = GROUP_TO_SENTIMENTS[group as keyof typeof GROUP_TO_SENTIMENTS];
    const options = scoredSentiments.reduce((acc, {sentiment, score, count}) => {
      if (groupSentiments.includes(sentiment) && count >= minCountToUse) {
        acc[sentiment] = score;
      }
      return acc;
    }, {} as Record<string, number>);
    let sentiments = multiWeightedRandomChoice(options, 3);

    // if we tried to put too many negative sentiments in a group that is not meant to be negative,
    // replace them
    if (
      !negativeGroups.includes(group) &&
      sentiments.filter(s => getSentimentValue(s) === "negative").length > 1
    ) {
      const remainingNonNegativeOptions = Object.fromEntries(Object.entries(options).filter(
        ([sentiment]) => getSentimentValue(sentiment) !== 
          "negative" && !sentiments.includes(sentiment)
      ));
      const nonNegativeSentiments = sentiments.filter(s => getSentimentValue(s) !== "negative");
      const negativeSentiments = sentiments.filter(s => getSentimentValue(s) === "negative");
      sentiments = [
        ...nonNegativeSentiments,
        negativeSentiments[0],
        ...multiWeightedRandomChoice(
          remainingNonNegativeOptions,
          Math.min(negativeSentiments.length - 1, Object.keys(remainingNonNegativeOptions).length)
        )
      ]
    }

    return sentiments;
  }).flat();
}

// returns a list of groups that have at least two eligible sentiments with a result count greater
// than minCount, as well as a list of groups with at least two non-negative eligible sentiments
const groupsWithAtLeastTwoEligibleSentiments = (
  {scoredSentiments, minCount} : {
    scoredSentiments: {sentiment: string, score: number, count: number}[],
    minCount: number,
  }) => {
  const groupToNumEligibleSentiments = scoredSentiments.reduce((acc, {sentiment, count}) => {
    const group = SENTIMENT_TO_GROUP[sentiment];
    if (count > minCount) {
      if (!acc[group]) {
        acc[group] = {
          nonNegativeOnly: 0,
          all: 0,
        };
      }
      if (getSentimentValue(sentiment) !== "negative") {
        acc[group].nonNegativeOnly = acc[group].nonNegativeOnly + 1;
      }
      acc[group].all = acc[group].all + 1;
    }
    return acc;
  }, {} as Record<string, {
    nonNegativeOnly: number,
    all: number
  }>);
  return {
    nonNegativeOnly: Object.entries(groupToNumEligibleSentiments).filter(
      ([_, {nonNegativeOnly}]) => nonNegativeOnly >= 2
    ).map(([group]) => group),
    all: Object.entries(groupToNumEligibleSentiments).filter(
      ([_, {all}]) => all >= 2
    ).map(([group]) => group),
  }
}


// returns an array of k distinct items from the given options, where the probability of
// choosing each item is proportional to its weight
const multiWeightedRandomChoice = (options: Record<string, number>, maxK: number) => {
  const ret = [];
  const optionsCopy = {...options};

  while (ret.length < maxK && Object.keys(optionsCopy).length > 0) {
    const item = singleWeightedRandomChoice(optionsCopy);
    ret.push(item);
    delete optionsCopy[item];
  }

  return ret;
}

// returns a random item from the given options, where the probability of choosing
// each item is proportional to its weight
const singleWeightedRandomChoice = (options: Record<string, number>) => {
  let i;

  const items = Object.keys(options);
  const weights = Object.values(options);

  for (i = 1; i < weights.length; i++)
    weights[i] += weights[i - 1];
  
  const random = Math.random() * weights[weights.length - 1];
  
  for (i = 0; i < weights.length; i++)
    if (weights[i] > random)
      break;
  
  return items[i];
}

const getSentimentBundleInfos = (passage: LabeledPassage): BundleInfo[] => {
  return passage.sentiments.map((sentiment) => {
    return {
      type: "sentiment",
      key: sentiment,
      sentiment,
      group: SENTIMENT_TO_GROUP[sentiment],
      value: getSentimentValue(sentiment),
    } as BundleInfo
  })
}