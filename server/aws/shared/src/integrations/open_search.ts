import { getImageColors } from "../utility/image";
import { VALID_SENTIMENTS } from "../utility/sentiments";
import { LabeledPassage, Recommendation, Song, SongWithLyrics } from "../utility/types";
import { getSearchClient } from "./aws";
import { getFirestoreDb } from "./firebase";
import { vectorizeSearchTerm } from "./open_ai/open_ai_integration";

// *** PUBLIC INTERFACE ***
// for a given user, we find the most relevant passages to show them for a given sentiment
// we do this by looking at their listening history - generally if a user has listened to
// a given song or artist more recently or frequently it will get a higher boost
export const getRecommendationsForSentiment = async (
  {userId, sentiment, limit, currentlyRecommendedSongIds, currentlyRecommendedArtistIds}:
  { 
    userId: string,
    sentiment: string,
    limit: number
    currentlyRecommendedSongIds?: string[],
    currentlyRecommendedArtistIds?: string[],
  }
): Promise<Recommendation[]> => {
  const db = await getFirestoreDb();

  console.log("getting impressions and recent listens");

  const [impressionsSnap, recentListensSnap] = await Promise.all([
    db.collection("user-impressions").doc(`${userId}-${sentiment}`).get(),
    db.collection("user-recent-listens").doc(userId).get()
  ]);

  console.log("got impressions and recent listens");

  const impressions = impressionsSnap.data()?.value || [];

  console.log("got impressions data");

  const recentListens = recentListensSnap.data() || {};

  console.log("got recent listens data");

  console.log("getting search client");

  const searchClient = getSearchClient();

  console.log("getting boosts");

  const {boosts, maxBoost} = getBoostsTerm({recentListens});

  console.log("constructing opensearch query");

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
                    {"ids": {"values": currentlyRecommendedSongIds || []}},
    
                    // if we have a current recommendation for this artist for this sentiment, don't
                    // get more
                    {"terms": {"primaryArtist.id": currentlyRecommendedArtistIds || []}},
                  ],
    
                  // only return passages that do have the specified sentiment
                  "filter": {"term": {"passageSentiments": sentiment}},
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
      "collapse": {
        "field": "primaryArtist.id",
        "inner_hits": {
          "name": "top_three",
          "size": 3
        }
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
  const parsedResults: {
    song: SongWithLyrics, passage: LabeledPassage, score: number
  }[][] = results.body.hits.hits.map((
    hit: {inner_hits: {top_three: {hits: {hits: Result[]}}}}
  ) => hit.inner_hits.top_three.hits.hits.map(
    (innerhit: Result) => {
      const {_id: songId, _score: score, _source: {passages, ...song}} = innerhit;
      const passage = selectOptimalPassage({passages, sentiment});
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
    }));

  // sort by score
  const sortedParsedResults = parsedResults.flat().sort((a, b) => b.score - a.score);

  // get the top N
  const passages = sortedParsedResults.slice(0, limit);

  const startImageDownload = Date.now();
  const colors = await Promise.all(passages.map(async (passage) => {
    const {album} = passage.song;
    const {image} = album;
    return await getImageColors({url: image.url});
  }));
  console.log(`took ${Date.now() - startImageDownload}ms to download and parse images`);

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

const selectOptimalPassage = ((
  {passages, sentiment}: {passages: LabeledPassage[], sentiment: string}
) => {
  // generally prefer passages with a "medium" number of lines
  const sortedOptimalNumEffectiveLines = [6, 5, 4, 7, 8, 3, 2, 1];

  // select the passage with the most optimal number of effective lines
  return passages.sort((a, b) => {
    // if a passage doesn't match the target sentiment, it loses by default
    if (!a.sentiments.includes(sentiment)) {
      return 1;
    }
    if (!b.sentiments.includes(sentiment)) {
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