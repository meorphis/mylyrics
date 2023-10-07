import { getImageColors } from "../utility/image";
import { addMetadataToPassage } from "../utility/recommendations";
import { 
  SENTIMENT_TO_GROUP,
  VALID_SENTIMENTS, VALID_SENTIMENTS_SET, getSentimentValue 
} from "../utility/sentiments";
import { 
  Artist, LabeledPassage, Recommendation, RecommendationType,
  Song, IndexedSong, BundleInfo, SimplifiedSong
} from "../utility/types";
import { uuidForPassage } from "../utility/uuid";
import { getSearchClient } from "./aws";
import { getFirestoreDb } from "./firebase";
import { vectorizeSearchTerm } from "./llm/open_ai_integration";

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
const NUMBER_OF_RECOMMENDATIONS_FOR_FEATURED_ARTIST = 10;

// *** PUBLIC INTERFACE ***
// function to get recommendations for a given user, across a few different categories:
// - featured artist: random passages from a song by one of the user's top artists
// - top passages: passages from the user's most frequent plays
// - sentiments: passages that match a given sentiment, generally that the user has
//    not seen in their recommendations before
export const getDailyRecommendations = async (
  {
    userId,
    recentListens,
    topSpotifyArtists,
    topSpotifySongs,
    featuredArtistOptions,
    recommendedSentiments,
  }:
  {
    userId: string,
    recentListens: Record<string, {songs?: string[]; artists?: string[];}>,
    topSpotifyArtists: Artist[],
    topSpotifySongs: SimplifiedSong[],
    featuredArtistOptions: Artist[],
    recommendedSentiments: string[],
  }
): Promise<{
  recommendations: Recommendation[],
  featuredArtist: Artist | null,
}> => {
  const db = await getFirestoreDb();

  let featuredArtist: Artist | null = null;
  let featuredArtistEmoji: string | null = null;
  let artistSearchResults: SearchResult[] = [];

  for (const potentialFeaturedArtist of featuredArtistOptions) {
    const docSnap = await db.collection("artists").doc(potentialFeaturedArtist.id).get()
    const data = docSnap.data();
    const potentialFeaturedArtistEmoji = data && data.artistEmoji;

    if (!potentialFeaturedArtistEmoji) {
      console.log(`no emoji found for artist ${potentialFeaturedArtist.name}`)
      continue;
    }
    
    console.log(`looking for passages for artist ${potentialFeaturedArtist.name}`)

    const results = await getSearchResultsForArtist({
      artistName: potentialFeaturedArtist.name,
    });

    if (results.length >= 3) {
      featuredArtist = potentialFeaturedArtist;
      featuredArtistEmoji = potentialFeaturedArtistEmoji;
      artistSearchResults = results;
      console.log(`found ${results.length} results for artist ${potentialFeaturedArtist.name}`)
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

  const sentimentSearchResults = await getSearchResultsForSentiments(
    {
      userId,
      sentiments: recommendedSentiments,
      recentListens,
      excludeSongIds: [
        ...artistSearchResults.map((r) => r.song.id),
        ...topPassageSearchResults.map((r) => r.song.id),
      ]
    }
  );
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
          group: "essentials",
          artist: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            name: featuredArtist!.name,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            emoji: featuredArtistEmoji!,
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

// sums the scores for all documents aggregated by sentiment for a given user; like
// getRecommendationsForSentiments, we boost recent listens and material that has not
// been seen yet, so this function gives us a good idea of which sentiments have a lot
// of content for getRecommendationsForSentiments to work with
export const getScoredSentiments = async (
  {userId, recentListens}:
  {
    userId: string
    recentListens: Record<string, {songs?: Array<string>, artists?: Array<string>} | undefined>,
  }
): Promise<{
  sentiment: string,
  count: number,
  score: number,
}[]> => {
  const db = await getFirestoreDb();
  const impressionsSnap  = await db.collection("user-impressions").doc(`${userId}-all`).get();
  const impressions = impressionsSnap.data()?.value || [];

  const searchClient = getSearchClient();

  const {boosts, maxBoost} = getBoostsTerm({recentListens});

  const query = {
    index: "song-lyric-songs",
    body: {
      "query": {
        "function_score": {
          "query": {
            "function_score": {
              "functions": boosts,
              "score_mode": "sum",
              "boost_mode": "replace",
              "min_score": 1.9
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
              "weight": maxBoost
            }
          ],
          "score_mode": "sum",
          "boost_mode": "sum",
        },
      },
      "aggs": {
        "group_by_passageSentiments": {
          "filters": {
            "filters": VALID_SENTIMENTS.reduce((
              acc: {[key: string]: {term: {passageSentiments: string}}},
              sentiment
            ) => {
              acc[sentiment] = { "term": { "passageSentiments": sentiment } };
              return acc;
            }, {}),
          },
          "aggs": {
            "total_score": {
              "sum": {
                "script": "_score"
              }
            }
          }
        }
      },
    }
  }

  const results = await searchClient.search(query);

  console.log(`took ${results.body.took}ms to get sentiment scores`);

  const buckets: {
    [sentiment: string]: {
      doc_count: number,
      total_score: {value: number},
    }
  } = results.body.aggregations.group_by_passageSentiments.buckets;

  return Object.entries(buckets).map(([sentiment, {doc_count, total_score}]) => {
    return {
      sentiment,
      count: doc_count,
      score: total_score.value,
    }
  }).filter((result) => result.count > 0);
};

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
      "size": NUMBER_OF_RECOMMENDATIONS_FOR_FEATURED_ARTIST,
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

// term to insert into queries to make sure that songs and artists that have been listened to
// recently and/or frequently are prioritized
const getBoostsTerm = (
  {recentListens} : 
  {
    recentListens: Record<string, {songs?: Array<string>, artists?: Array<string>} | undefined>,
  }
): {
  boosts: unknown[],
  maxBoost: number,
} => {
  // first get lists of songs and artists at all time scales
  const songsYesterday = recentListens.yesterday?.songs || [];
  const artistsYesterday = recentListens.yesterday?.artists || [];
  const songsLastWeek = [2, 3, 4, 5, 6, 7, 8].map((daysAgo) => {
    return recentListens[`daysago-${daysAgo}`]?.songs || [];
  }).flat();
  const artistsLastWeek = [2, 3, 4, 5, 6, 7, 8].map((daysAgo) => {
    return recentListens[`daysago-${daysAgo}`]?.artists || [];
  }).flat();
  const songsLongerAgo = recentListens.longerAgo?.songs || [];
  const artistsLongerAgo = recentListens.longerAgo?.artists || [];

  // find songs that should have frequency boosts
  const allSongs = [
    ...songsYesterday,
    ...songsLastWeek,
    ...songsLongerAgo,
  ];
      
  const allArtists = [
    ...artistsYesterday,
    ...artistsLastWeek,
    ...artistsLongerAgo,
  ];

  const songFrequency = new Map();

  // Count the frequency of each songId
  for (const songId of allSongs) {
    songFrequency.set(songId, (songFrequency.get(songId) || 0) + 1);
  }
  
  // Filter out the songs that appear more than 10 times
  const veryFrequentSongs = allSongs.filter((songId) => {
    return songFrequency.get(songId) > 10;
  });
      
  // songs that have been played several times, but that are not veryFrequentSongs
  const veryFrequentSongsSet = new Set(veryFrequentSongs);
  const frequentSongs = allSongs.filter((songId) => {
    return !veryFrequentSongsSet.has(songId) && songFrequency.get(songId) > 3;
  });

  // songs that have been played multiple times, but that are not veryFrequentSongs or frequentSongs
  const frequentSongsSet = new Set([...frequentSongs, ...veryFrequentSongs]);
  const slightlyFrequentSongs = allSongs.filter((songId) => {
    return !frequentSongsSet.has(songId) && songFrequency.get(songId) > 1;
  });
      
  const artistFrequency = new Map();
  for (const artistId of allArtists) {
    artistFrequency.set(artistId, (artistFrequency.get(artistId) || 0) + 1);
  }

  // artists that have been played many times
  const veryFrequentArtists = allArtists.filter((artistId) => {
    return artistFrequency.get(artistId) > 25;
  });
      
  // artists that have been played several times, but that are not veryFrequentArtists
  const veryFrequentArtistsSet = new Set(veryFrequentArtists);
  const frequentArtists = allArtists.filter((artistId) => {
    return !veryFrequentArtistsSet.has(artistId) && artistFrequency.get(artistId) > 10;
  });

  // artists that have been played multiple times, but that are not veryFrequentArtists or
  // frequentArtists
  const frequentArtistsSet = new Set([...frequentArtists, ...veryFrequentArtists]);
  const slightlyFrequentArtists = allArtists.filter((artistId) => {
    return !frequentArtistsSet.has(artistId) && artistFrequency.get(artistId) > 5;
  });

  // format the lists of songs and artists into filters for the search query
  const songFrequencyFilters = [
    veryFrequentSongs, frequentSongs, slightlyFrequentSongs
  ].map((songList) => {
    return songList.length ? {"ids": {"values": Array.from(new Set(songList))}} : null;
  });

  const artistFrequencyFilters = [
    veryFrequentArtists, frequentArtists, slightlyFrequentArtists
  ].map((artistList) => {
    return artistList.length ? {
      "terms": {"primaryArtist.id": Array.from(new Set(artistList))}
    } : null;
  });

  // songs generally get bigger boosts and artists but a more frequent artist is worth more than
  // a less frequent song
  const frequencyFilters = [
    songFrequencyFilters[0],
    artistFrequencyFilters[0],
    songFrequencyFilters[1],
    artistFrequencyFilters[1],
    songFrequencyFilters[2],
    artistFrequencyFilters[2],
  ];

  // now find songs and artists that should have recency boosts
  const rawSongRecencyBoostCandidates = [
    songsYesterday,
    songsLastWeek,
    songsLongerAgo,
  ];

  const rawArtistRecencyBoostCandidates = [
    artistsYesterday,
    artistsLastWeek,
    artistsLongerAgo,
  ];

  // make sure that no song gets a recency boost in more than one time scale
  const songRecencyFilters = rawSongRecencyBoostCandidates.map((boostCandidateList, i) => {
    const songsFromPreceedingLists = new Set(rawSongRecencyBoostCandidates.slice(0, i).flat());
    const filteredCandidateList = Array.from(new Set(boostCandidateList.filter((songId) => {
      return !songsFromPreceedingLists.has(songId);
    })));
    return filteredCandidateList.length ? {"ids": {"values": filteredCandidateList}} : null;
  });
      
  const artistRecencyFilters = rawArtistRecencyBoostCandidates.map((boostCandidateList, i) => {
    const artistsFromPreceedingLists = new Set(rawArtistRecencyBoostCandidates.slice(0, i).flat());
    const filteredCandidateList = Array.from(new Set(boostCandidateList.filter((artistId) => {
      return !artistsFromPreceedingLists.has(artistId);
    })));
    return filteredCandidateList.length ? {
      "terms": {"primaryArtist.id": filteredCandidateList}
    } : null;
  });

  // we generally want to boost songs that the user has actually listened to to the top;
  // if the user has a special affinity for a given song or artist that should break ties;
  // if the user has listened to a certain artist recently, that's still a signal though not as
  // important as the others
  const sortedBoostFilters = [
    ...songRecencyFilters,
    ...frequencyFilters,
    ...artistRecencyFilters,
  ].filter((f) => f != null)

  const recentListenFilters = sortedBoostFilters.map((filter, index) => {
    return {
      filter,
      // 2^x ensures that two lower-tier boosts cannot outweigh a higher-tier boost
      weight: Math.pow(2, sortedBoostFilters.length - index)
    }
  });

  // popularity boost will be a value between 0 and ~2, small enough to not outweigh any of the
  // other boosts but large enough to break ties
  const popularityBoost = {
    "filter" : {
      "match_all": {}
    },
    "field_value_factor": {
      "field": "popularity",
      "modifier": "log1p",
      "missing": 0
    },
  }

  const ret = {
    boosts: [...recentListenFilters, popularityBoost],
    maxBoost: Math.pow(2, recentListenFilters.length + 1),
  }

  return ret;
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