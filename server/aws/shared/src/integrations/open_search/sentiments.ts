import { uniq } from "lodash";
import { getSearchClient } from "../aws";
import { getFirestoreDb } from "../firebase";
import { VALID_SENTIMENTS } from "../../utility/sentiments";
import { getBoostsTerm } from "./common";

type SentimentResult = {
    sentiment: string;
    score: number;
    percentage: number;
    topArtists: {
        id: string;
        score: number;
    }[];
  }

// *** PUBLIC INTERFACE ***
// for a given time interval and a given user's recent listens, returns a list containing the
// user's sentiments that most frequently appear along with the percentage of songs that they
// appear in and the artists most representative of each sentiment
// returns null if we don't have enough recent listen data to produce a good result
export const getTopSentimentsWithTopArtistsInInterval = async (
  {recentListens, interval}: {
      recentListens: Record<string, {songs?: Array<string>, artists?: Array<string>} | undefined>,
      interval: "last-day" | "last-week" | "all-time",
    }) => {
  const searchClient = getSearchClient();
  
  let songIds: string[] = [];
  
  songIds = recentListens.yesterday?.songs as string [];
  if (["last-week", "all-time"].includes(interval)) {
    songIds.push(...[2, 3, 4, 5, 6, 7].map((daysAgo) => {
      return (recentListens[`daysago-${daysAgo}`]?.songs || []) as string[];
    }).flat());
  }
  if (interval === "all-time") {
    songIds.push(...(recentListens.longerAgo?.songs || []) as string[]);
  }

  if (songIds.length < 10) {
    return null;
  }
  
  console.log(`computing boosts for ${songIds.length} songs`);
  const songIdsToCount = songIds.reduce((acc, songId) => {
    acc[songId] = (acc[songId] || 0) + 1;
    return acc;
  }, {} as {[key: string]: number});

  const bucketToSongIds = Object.entries(songIdsToCount).reduce((acc, [songId, count]) => {
    const bucket = Math.pow(2, Math.round(Math.log2(count)))
    if (!acc[bucket]) {
      acc[bucket] = [];
    }
    acc[bucket].push(songId);
    return acc;
  }, {} as {[key: number]: string[]});

  const boosts = Object.entries(bucketToSongIds).map(([bucket, songIds]) => {
    return {
      "filter": {
        "ids": {
          "values": songIds
        }
      },
      "weight": parseInt(bucket)
    }
  });
  console.log(`computed sentiment boosts for ${songIds.length} songs`);

  const uniqueSongIds = uniq(songIds);
  
  const query = {
    index: "song-lyric-songs",
    body: {
      "query": {
        "function_score": {
          "query": {
            "ids": {
              "values": uniqueSongIds
            }
            
          },
          "functions": boosts,
          "score_mode": "sum"
        }
      },
      "aggs": {
        "by_sentiment": {
          "filters": {
            "filters": VALID_SENTIMENTS.reduce((
              acc: {[key: string]: {term: {sentiments: string}}},
              sentiment
            ) => {
              acc[sentiment] = { "term": { "sentiments": sentiment } };
              return acc;
            }, {}),      
          },    
          "aggs": {
            // unfortunately this sorts by count not score - there deoesn't seem to be
            // a straightforward way to sort by score
            "top_artists": {
              "terms": {
                "field": "primaryArtist.id",
                "size": 10
              },
              "aggs": {
                "total_score": {
                  "sum": {
                    "script": "_score"
                  }
                }
              }
            },
            "total_score": {
              "sum": {
                "script": "_score"
              }
            }
          }
        }
      },
      "size": 0
    }
  }
  
  const output = await searchClient.search(query);
  
  const rawResults = Object.entries(
      output.body.aggregations.by_sentiment.buckets as {
        [sentiment: string]: {
          doc_count: number,
          total_score: {value: number},
          top_artists: {buckets: {key: string, doc_count: number, total_score: {value: number}}[]},
        }
      }
  )

  const aggregateScore = rawResults.reduce((acc, [_, {total_score}]) => {
    return acc + total_score.value;
  }, 0);

  const results = rawResults.map(([sentiment, {total_score, top_artists}]) => {
    return {
      sentiment,
      score: total_score.value,
      percentage: 100 * total_score.value / aggregateScore,
      topArtists: top_artists.buckets.map((b) => ({id: b.key, score: b.total_score.value})),
    }
  });
  
  const parsedResults = parseTopSentimentResults(results);
  
  // TODO: clean this up
  const allArtistIds = uniq(parsedResults.flatMap((r) => r.artists.map((a) => a.id)));
  const db = await getFirestoreDb();
  const artists = await db.getAll(...allArtistIds.map((id) => db.collection("artists").doc(id)));
  return parsedResults.map((r) => {
    return {
      sentiment: r.sentiment,
      percentage: r.percentage,
      artists: (r.artists.map((artist) => {
        const artistDoc = artists.find((a) => a.id === artist.id);
        return artistDoc?.data() || null;
      }).filter((a) => a !== null) as {artistName: string}[]).map((artist) => ({
        name: artist.artistName,
      })),
    }
  });
}


// sums the scores for all documents aggregated by sentiment for a given user; like
// getRecommendationsForSentiments, we boost recent listens and material that has not
// been seen yet, so this function gives us a good idea of which sentiments have a lot
// of content for getRecommendationsForSentiments to work with
export const getScoredSentiments = async (
  {userId, recentListens, excludeSongIds}:
    {
      userId: string
      recentListens: Record<string, {songs?: Array<string>, artists?: Array<string>} | undefined>,
      excludeSongIds?: string[],
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
              "query": {
                "bool": {
                  "must_not": [
                    // do not return songs that the user has already seen passages from with this
                    // sentiment attached (either currently or before)
                    {"ids": {"values": excludeSongIds}},
                  ]
                },
              },
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
// our search query produces a list of all sentiments along with their counts ane the
// their top artists - here we transform that result to include only the top 5 sentiments
// along with a modified form of top artists (see inline comments)
const parseTopSentimentResults = (results: SentimentResult[]) => {
  const topSentiments = results
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => ({...r, artists: [] as {id: string}[]}));
  const artistToSentimentScores = results.reduce((acc, {topArtists, sentiment}) => {
    topArtists.forEach(({id, score}) => {
      if (!acc[id]) {
        acc[id] = {};
      }
      acc[id][sentiment] = score;
      acc[id].total = (acc[id].total || 0) + score;
    });
    return acc;
  }, {} as {[key: string]: {[key: string]: number}});
  
  Object.entries(artistToSentimentScores)
  // iterate through artists in order of total score
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([artistId, sentimentScore]) => {
      let addedNum = 0;
      Object.entries(sentimentScore)
        .filter(([_, score]) => score > 1)
        .sort((a, b) => b[1] - a[1])
        // if a sentiment appears in an artist's top three, we consider that artist to be a good
        // representative for that sentiment
        .slice(0, 3)
        .forEach(([sentiment]) => {
          // allow an artist to represent at most two sentiments
          if (addedNum < 2) {
            const topSentiment = topSentiments.find((s) => s.sentiment === sentiment);
            // allow at most two artists per sentiment
            if (topSentiment && topSentiment.artists.length < 2) {
              topSentiment.artists.push({id: artistId});
              addedNum += 1;
            }
          }
        })
    })
    
  return topSentiments;
}