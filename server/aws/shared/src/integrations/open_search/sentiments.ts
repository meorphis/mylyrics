import { uniq } from "lodash";
import { getSearchClient } from "../aws";
import { getFirestoreDb } from "../firebase";
import { VALID_SENTIMENTS } from "../../utility/sentiments";
import { getBoostsTerm } from "./common";

type SentimentResult = {
    sentiment: string;
    count: number;
    percentage: number;
    topArtists: {
        id: string;
        count: number;
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
  
  const uniqueSongIds = [...new Set(songIds)];
  
  if (uniqueSongIds.length < 10) {
    return null;
  }
  
  const query = {
    index: "song-lyric-songs",
    body: {
      "query": {
        "bool": {
          "filter": [
            {
              "ids": {
                "values": uniqueSongIds
              }
            }
          ]
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
            "top_artists": {
              "terms": {
                "field": "primaryArtist.id",
                "size": 5  // Top 5 artists for each sentiment
              }
            }
          }
        }
      },
      "size": 0  // No hits, just aggregations
    }
  }
  
  const output = await searchClient.search(query);
  
  const results = Object.entries(
      output.body.aggregations.by_sentiment.buckets as {
        [sentiment: string]: {
          doc_count: number,
          top_artists: {buckets: {key: string, doc_count: number}[]},
        }
      }
  ).map(([sentiment, {doc_count, top_artists}]) => {
    return {
      sentiment,
      count: doc_count,
      percentage: 100 * doc_count / uniqueSongIds.length,
      topArtists: top_artists.buckets.map((b) => ({id: b.key, count: b.doc_count})),
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
// our search query produces a list of all sentiments along with their counts ane the
// their top artists - here we transform that result to include only the top 5 sentiments
// along with a modified form of top artists (see inline comments)
const parseTopSentimentResults = (results: SentimentResult[]) => {
  const topSentiments = results
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((r) => ({...r, artists: [] as {id: string}[]}));
  const artistToSentimentCounts = results.reduce((acc, {topArtists, sentiment}) => {
    topArtists.forEach(({id, count}) => {
      if (!acc[id]) {
        acc[id] = {};
      }
      acc[id][sentiment] = count;
      acc[id].total = (acc[id].total || 0) + count;
    });
    return acc;
  }, {} as {[key: string]: {[key: string]: number}});
  
  Object.entries(artistToSentimentCounts)
  // iterate through artists in order of total count
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([artistId, sentimentCounts]) => {
      let addedCount = 0;
      Object.entries(sentimentCounts)
        .filter(([_, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
      // if a sentiment appears in an artist's top five, we consider that artist to be a good
      // representative for that sentiment
        .slice(0, 5)
        .forEach(([sentiment]) => {
          // allow an artist to represent at most two sentiments
          if (addedCount < 2) {
            const topSentiment = topSentiments.find((s) => s.sentiment === sentiment);
            // allow at most three artists per sentiment
            if (topSentiment && topSentiment.artists.length < 3) {
              topSentiment.artists.push({id: artistId});
              addedCount += 1;
            }
          }
        })
    })
    
  return topSentiments;
}