import { getImageColors } from "../utility/image";
import { VALID_SENTIMENTS } from "../utility/sentiments";
import { LabeledPassage, Recommendation, Song, SongWithLyrics } from "../utility/types";
import { getSearchClient } from "./aws";
import { getFirestoreDb } from "./firebase";
import { vectorizeSearchTerm } from "./open_ai/open_ai_integration";

type SearchResult = {
    song: SongWithLyrics, passage: LabeledPassage, score: number
};

const NUMBER_OF_RECOMMENDATIONS_FOR_MAIN_SENTIMENT = 10;
const NUMBER_OF_RECOMMENDATIONS_FOR_SECONDARY_SENTIMENTS = 5;

// *** PUBLIC INTERFACE ***
// for a given user, we find the most relevant passages to show them for a given set of sentiments
// we do this by looking at their listening history - generally if a user has listened to
// a given song or artist more recently or frequently it will get a higher boost
export const getRecommendationsForSentiments = async (
  {userId, sentiments}:
  { 
    userId: string,
    sentiments: string[],
  }
): Promise<Recommendation[]> => {
  const db = await getFirestoreDb();

  console.log("getting impressions and recent listens");

  const [recentListensSnap, ...impressionsSnaps] = await db.getAll(
    db.collection("user-recent-listens").doc(userId),
    ...sentiments.map(s => db.collection("user-impressions").doc(`${userId}-${s}`))
  );

  console.log("got impressions and recent listens");

  const impressions = impressionsSnaps.map((snap) => snap.data()?.value || []).flat();

  console.log("got impressions data");

  const recentListens = recentListensSnap.data() || {};

  console.log("got recent listens data");

  console.log("getting boosts");

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
    numResultsStillNeeded: NUMBER_OF_RECOMMENDATIONS_FOR_MAIN_SENTIMENT + (
      sentiments.length - 1
    ) * NUMBER_OF_RECOMMENDATIONS_FOR_SECONDARY_SENTIMENTS,
    depletedSongIds: [] as string[],
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
  const sortedFilteredResults = filteredResults.sort((a, b) => b.score - a.score);

  const startImageDownload = Date.now();
  const colors = await Promise.all(sortedFilteredResults.map(async (passage) => {
    const {album} = passage.song;
    const {image} = album;
    return await getImageColors({url: image.url});
  }));
  console.log(`took ${Date.now() - startImageDownload}ms to download and parse images`);

  return sortedFilteredResults.map(({song, passage, score}, idx) => {
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
      tags: passage.sentiments.map((sentiment) => {
        return {
          type: "sentiment",
          sentiment,
        }
      }),
      score,
    }
  });
}

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

  type Result = {
    _id: string,
    _score: number,
    _source: {song: Song} & LabeledPassage
  }

  // unpack search results
  const passages: {
    song: SongWithLyrics, passage: LabeledPassage, score: number
  }[] = results.body.hits.hits.map((hit: Result) => {
    const {_score: score, _source: {song, ...passage}} = hit;
    return {
      song,
      // select the passage most suitable for display
      passage: {
        ...passage,
        sentiments: passage.sentiments.filter((s) => VALID_SENTIMENTS.includes(s)),
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
      tags: passage.sentiments.map((sentiment) => {
        return {
          type: "sentiment",
          sentiment,
        }
      }),
      score,
    }
  });
}

export const getScoredSentiments = async (
  {userId}: {userId: string}
): Promise<{
  sentiment: string,
  count: number,
  score: number,
}[]> => {
  const db = await getFirestoreDb();
  const [impressionsSnap, recentListensSnap] = await Promise.all([
    db.collection("user-impressions").doc(`${userId}-all`).get(),
    db.collection("user-recent-listens").doc(userId).get()
  ]);
  const impressions = impressionsSnap.data()?.value || [];
  const recentListens = recentListensSnap.data() || {};

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
  });
};

// *** PRIVATE HELPERS ***
const getBoostsTerm = (
  {recentListens} : 
  {
    recentListens: Record<string, {songs: Array<string>, artists: Array<string>} | undefined>,
  }
) => {
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

  return {
    boosts: [...recentListenFilters, popularityBoost],
    maxBoost: Math.pow(2, recentListenFilters.length + 1),
  }
}

const getRecentSongs = async (
  {recentListens} : 
  {
    recentListens: Record<string, {songs: Array<string>, artists: Array<string>} | undefined>,
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

  type Result = {
    _id: string,
    _score: number,
    _source: Omit<Song, keyof {id: string}> & {passages: LabeledPassage[]}
  }

  // unpack search results
  const parsedResults: SearchResult[] = results.body.hits.hits.map(
    (result: Result) => {
      const {_id: songId, _score: score, _source: {passages, ...song}} = result;
      const passage = selectOptimalPassage({passages, sentiments});
      return {
        song: {
          id: songId,
          ...song,
        },
        // select the passage most suitable for display
        passage: {
          ...passage,
          sentiments: passage.sentiments.filter((s) => VALID_SENTIMENTS.includes(s)),
        },
        score,
      }
    });

  return parsedResults;
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
    // we need at least 10 passages for the first sentiment and 5 for the rest
    return Math.max(
      0, sentiment === sentiments[0]
        ? NUMBER_OF_RECOMMENDATIONS_FOR_MAIN_SENTIMENT - sentimentOccurances :
        NUMBER_OF_RECOMMENDATIONS_FOR_SECONDARY_SENTIMENTS - sentimentOccurances)
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