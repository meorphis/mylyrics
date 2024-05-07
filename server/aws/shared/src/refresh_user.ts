import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { getFirestoreDb } from "./integrations/firebase";
import { getDailyPassageRecommendations } from "./integrations/open_search/passages";

import { sqs } from "./integrations/aws";
import { sendRecommendationNotif } from "./integrations/notifications";
import { getTopArtistsForUser, getTopTracksForUser } from "./integrations/spotify/spotify_data";
import { getFreshSpotifyResponse } from "./integrations/spotify/spotify_auth";
import { Recommendation } from "./utility/types";
import { getTopSentimentsWithTopArtistsInInterval } from "./integrations/open_search/sentiments";
import { computeAnalysis } from "./integrations/llm/open_ai_integration";

// *** CONSTANTS ***
// recent listens: note that recent listen limits are not hard limits - we never delete records from
// the last week, only earlier than that
const MAX_NUM_SONGS_TO_REMEMBER = 5000;
const MAX_NUM_ARTISTS_TO_REMEMBER = 250;

// impressions: we keep track of impressions for each sentiment, for all sentiments, and for top
// tracks; these are hard limits
const MAX_IMPRESSIONS_TO_REMEMBER = 2500;
const MAX_SENTIMENT_IMPRESSIONS_TO_REMEMBER = 250;
// we only actally use the first 50 of these, but we keep more in case we want to change this logic
// later
const MAX_TOP_TRACK_IMPRESSIONS_TO_REMEMBER = 250;
const MAX_TOP_PASSAGE_IMPRESSIONS_TO_REMEMBER = 250;

const MAX_NOTIFICATIONS_TO_REMEMBER = 500;
const MAX_FEATURED_ARTISTS_TO_REMEMBER = 10;

// we aggregate song impressions from across sentiments into the "all" category; top-passage is
// excluded because it consists of passage IDs, not song IDs
const IMPRESSION_KEYS_TO_EXCLUDE_FROM_AGGREGATE = new Set(["top-passages"]);

// *** PUBLIC INTERFACE ***
// run daily (or as part of NUX) to give the user new content for the day
// - updates the user's recent listens data to mark the passage of a new day
// - finds the user's recommended sentiments
// - finds relevant passages for the user's daily recommendations
// - sends a notification to the user with the top recommendation
export const refreshUser = async ({
  userId, isNewUser = false,
} : {
  userId: string,
  isNewUser?: boolean,
}) => {
  // make sure we have all the environment variables we need
  assertEnvironmentVariables();

  const db = await getFirestoreDb();
  const [userRecommendationsSnap, userDataSnap] = await db.getAll(
    db.collection("user-recommendations").doc(userId),
    db.collection("users").doc(userId),
  );

  if (!userDataSnap.exists) {
    console.log(`user ${userId} does not exist`);
    return;
  }

  const userRecommendations = userRecommendationsSnap.data() || {};

  const {
    lastRefreshedAt,
    lastPushedBackRecentPlaysAt,
    dayCount = 1,
    recommendations: oldRecommendations = [],
    notificationHistory = [],
    sentimentsUpdatedAt = []
  } = userRecommendations;

  // this shouldn't happen, but if we somehow create a task for a user that already been
  // refreshed within the last 12 hours, just skip it
  if (
    lastRefreshedAt != null &&
    lastRefreshedAt > Date.now() - 12 * 60 * 60 * 1000
  ) {
    console.log(`recommendations already refreshed for user ${userId}`);
    return;
  }

  const promises: Promise<void>[] = [
    pushBackUserImpressions({userId})
  ]

  // we don't necessarily want to push back recent plays, as doing so is not idempotent
  // and this could be a retry; pushing backing impressions on the other hand is idempotent
  // so it's fine to do it multiple times
  if (
    lastPushedBackRecentPlaysAt == null ||
    lastPushedBackRecentPlaysAt < Date.now() - 12 * 60 * 60 * 1000
  ) {
    console.log(`pushing back recent plays for user ${userId}`);
    promises.push(pushBackUserRecentListens({userId}));
  } else {
    console.log(`recent plays already pushed back for user ${userId}`);
  }

  await Promise.all(promises);

  const recentListens = (await db.collection("user-recent-listens").doc(userId).get()).data() ?? {};

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const spotifyResponse = await getFreshSpotifyResponse(userDataSnap.data()!);

  if (spotifyResponse == null) {
    console.log(`no spotify access token for user ${userId}`);
    return;
  }
  
  if (spotifyResponse.status !== 200) {
    throw new Error(
      `error getting spotify access token for user ${userId}: ${JSON.stringify(spotifyResponse)}`
    );
  }

  console.log(`got spotify access token for user ${userId}`);
  
  const {access_token: spotifyAccessToken} = spotifyResponse.data;
  
  const recentlyFeaturedArtistIds = new Set(userRecommendations.featuredArtistHistory ?? []);
  const topSpotifyArtists = await getTopArtistsForUser({spotifyAccessToken, limit: 15});
  const topSpotifySongs = isNewUser ? await getTopTracksForUser({
    spotifyAccessToken, limit: 20, time_range: "short_term"
  }) : [];

  let featuredArtistIdOptions: string[];

  const shouldUseFiveSentiments = isNewUser || Date.now() < 1709010000000;

  // just pick one of the user's top artists
  if (shouldUseFiveSentiments) {
    featuredArtistIdOptions = [];
  } else {
    // first look at artists that were played a lot yesterday
    featuredArtistIdOptions = Object.entries(
      ((recentListens.yesterday?.artists ?? []) as string[])
        .reduce((acc, artist) => {
          acc[artist] = (acc[artist] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    ).filter(([artist, count]) => 
      !recentlyFeaturedArtistIds.has(artist) && count >= 10
    ).sort(
      ([_, count1], [__, count2]) => count2 - count1
    )
      .slice(0, 10)
      .map(([artist]) => artist);

    // if not enough artists pass the frequency bar, look at the user's top spotify artists
    // to fill in the rest
    if (featuredArtistIdOptions.length < 10) {
      const topArtistIdsEligibleForFeature = topSpotifyArtists
        .map((artist) => artist.id)
        .filter((artistId) => {
          return !recentlyFeaturedArtistIds.has(artistId);
        });

      featuredArtistIdOptions.push(...getRandomIndexes(
        topArtistIdsEligibleForFeature.length,
        Math.min(topArtistIdsEligibleForFeature.length, 10 - featuredArtistIdOptions.length)
      ).map(idx => topArtistIdsEligibleForFeature[idx]))
    }
  }

  console.log(
    // eslint-disable-next-line max-len
    `featured artist options for user ${userId}: ${JSON.stringify(featuredArtistIdOptions)}`
  );

  const intervals = ["last-day"];

  // we're on day #2 at least (or many of the songs that we already have on the first day are NOT
  // from the last day), so we can plausibly represent a week's worth of data
  if (dayCount > 1 || recentListens?.yesterday?.songs?.length < 10) {
    intervals.push("last-week");
  }

  // we have all-time statistics from the start from indexing the user's top spotify statistics
  intervals.push("all-time");

  const [{
    recommendations: newUnanalyzedRecommendations,
    recommendationSentiments,
    featuredArtist,
  }, ...topSentimentArray] = await Promise.all([
    getDailyPassageRecommendations(
      {
        userId,
        recentListens,
        topSpotifyArtists,
        topSpotifySongs,
        featuredArtistIdOptions,
        shouldUseFiveSentiments,
        excludeSongIds: notificationHistory,
        excludeSentiments: sentimentsUpdatedAt
          .slice(0, 5)
          .map((s: {sentiment: string, updatedAt: number}) => s.sentiment),
      }
    ),
    ...intervals.map((interval) => getTopSentimentsWithTopArtistsInInterval({
      recentListens,
      interval: interval as "last-day" | "last-week" | "all-time",
    }))
  ]);


  const topSentiments = Object.fromEntries(
    topSentimentArray.map((topSentiments, i) => {
      return [intervals[i], topSentiments];
    })
  );

  const analyses = await Promise.all([
    computeAnalysis({passages: [newUnanalyzedRecommendations[0]], model: "gpt-4o"}),
    ...newUnanalyzedRecommendations.slice(1).map((r) => 
      computeAnalysis({passages: [r], model: "gpt-4o"})
    )
  ]);

  console.log(JSON.stringify(analyses));

  const newRecommendations = newUnanalyzedRecommendations.map((r, i) => ({
    ...r,
    analysis: analyses[i],
  }))

  const recommendations = [
    ...newRecommendations,
    ...oldRecommendations
      // remove old matches for these sentiments
      .filter((r: Recommendation) => !(
        recommendationSentiments && recommendationSentiments.includes(r.bundleInfos[0].key))
      )
      // remove old matches for this artist
      .filter((r: Recommendation) => !(featuredArtist && r.bundleInfos.some((b) => b.type === "artist")))
      // remove duplicate songs
      .filter((r: Recommendation) => !newRecommendations.some((newR) => newR.song.id === r.song.id))
  ].filter((r: Recommendation) => !!r.analysis)

  const now = Date.now();

  const newSentimentsUpdatedAt: {sentiment: string, updatedAt: number}[] = sentimentsUpdatedAt;

  if (recommendationSentiments) {
    newSentimentsUpdatedAt.unshift(...recommendationSentiments.map((r) => ({
      sentiment: r,
      updatedAt: now,
    })));
  }

  const batch = db.batch();
  batch.set(db.collection("user-recommendations").doc(userId), {
    recommendations,
    recommendationSentiments: newSentimentsUpdatedAt.map((s: {sentiment: string, updatedAt: number}) => s.sentiment),
    sentimentsUpdatedAt: newSentimentsUpdatedAt,
    topSentiments,
    lastRefreshedAt: now,
    dayCount: dayCount + 1,
    notificationHistory: [
      recommendations[0].song.id,
      ...userRecommendations.notificationHistory || [],
    ].slice(0, MAX_NOTIFICATIONS_TO_REMEMBER),
    featuredArtistHistory: [
      ...(featuredArtist ? [featuredArtist.id] : []),
      ...userRecommendations.featuredArtistHistory || [],
    ].slice(0, MAX_FEATURED_ARTISTS_TO_REMEMBER),
  }, {merge: true}
  );
  batch.update(db.collection("users").doc(userId), {
    // double write this value to save us a read in process_users
    lastRefreshedAt: now,
  });

  console.log(JSON.stringify(recommendations[0]));

  await Promise.all([
    batch.commit(),
    sendRecommendationNotif({userId, recommendation: recommendations[0]}),
  ]);
}

// creates a task to run refreshUser
export const createRefreshUserTask = async (
  {
    userId,
    isNewUser = false,
    delaySeconds
  }: {
    userId: string,
    isNewUser?: boolean,
    delaySeconds?: number
  }
) => {
  // eslint-disable-next-line max-len
  console.log(`adding task to queue for user ${userId} ${isNewUser} ${delaySeconds}`);

  try {
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.REFRESHUSERQUEUE_QUEUE_URL as string,
      MessageBody: JSON.stringify({
        userId,
        isNewUser,
      }),
      DelaySeconds: delaySeconds,
    }));
    console.log("successfully added task to queue");
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`failed to add message to queue: ${err.message}`, err.stack);
    }
  }

}

// *** PRIVATE HELPERS ***
const assertEnvironmentVariables = () => {
  if (process.env.OPENSEARCH_URL == null) {
    throw new Error("OPENSEARCH_URL is not defined in the environment");
  }
  if (process.env.REFRESHUSERQUEUE_QUEUE_URL == null) {
    throw new Error("REFRESHUSERQUEUE_QUEUE_URL is not defined in the environment");
  }
}

// for a given user, we essentially acknowledge that it is a new day
// all of the records of when they listened to songs and artists are moved back one day
// on the whole, we retain songs and artists from:
// - today
// - yesterday
// - N days ago for N between 2 and 8
// - longer ago, up to a limit
const pushBackUserRecentListens = async (
  {userId} : {userId: string},
) => {
  const db = await getFirestoreDb();

  await db.runTransaction(async (transaction) => {
    const docRef = db.collection("user-recent-listens").doc(userId);
    const doc = await transaction.get(docRef);
    const data = doc.data() || {};
    const today = data.today || {};
    const yesterday = data.yesterday || {};
    const daysago = [2, 3, 4, 5, 6, 7, 8].map((daysAgo) => {
      return data[`daysago-${daysAgo}`] || {};
    });
    const longerAgo = data.longerAgo || {};
  
    const totalNumSongs = [
      today.songs?.length || 0,
      yesterday.songs?.length || 0,
      ...daysago.map((day) => day.songs?.length || 0),
      longerAgo.songs?.length || 0,
    ].reduce((a, b) => a + b, 0);
  
    const totalNumArtists = [
      today.artists?.length || 0,
      yesterday.artists?.length || 0,
      ...daysago.map((day) => day.artists?.length || 0),
      longerAgo.artists?.length || 0,
    ].reduce((a, b) => a + b, 0);
  
    const numSongsToRemove = Math.max(0, totalNumSongs - MAX_NUM_SONGS_TO_REMEMBER);
    const numArtistsToRemove = Math.max(0, totalNumArtists - MAX_NUM_ARTISTS_TO_REMEMBER);
      
    const newLongerAgoSongs = [
      ...daysago[-1]?.songs || [],
      ...longerAgo.songs || [],
    ];
      
    const newLongerAgoArtists = [
      ...daysago[-1]?.artists || [],
      ...longerAgo.artists || [],
    ];
  
    const newLongerAgo = {
      // if the total number of songs is greater than the limit, remove the difference
      songs: newLongerAgoSongs.slice(
        0, newLongerAgoSongs.length - numSongsToRemove
      ),
      // similar for artists
      artists: newLongerAgoArtists.slice(
        0, newLongerAgoArtists.length - numArtistsToRemove
      ),
    };
    const update: Record<string, {songs?: Array<string>, artists?: Array<string>}> = {
      today: {
        songs: [],
        artists: [],
      },
      yesterday: today,
      "daysago-2": yesterday,
      longerAgo: newLongerAgo,
    }
  
    daysago.slice(0, -1).forEach((day, i) => {
      update[`daysago-${i + 3}`] = day;
    });
  
    transaction.set(docRef, update);

    transaction.set(db.collection("user-recommendations").doc(userId), {
      lastPushedBackRecentPlaysAt: Date.now(),
    }, {merge: true});

    return update;
  });
}

// moves impressions from the last day into the historical log of impressions; unlike
// user-impressions-today, user-impressions has a document per user per sentiment 
const pushBackUserImpressions = async (
  {userId} : {userId: string},
) => {
  const db = await getFirestoreDb();
  const impressionTodayDoc = await db.doc(`user-impressions-today/${userId}`).get();
  const impressionsToday = (impressionTodayDoc.data()?.value || {}) as Record<string, string[]>;

  const keys = Object.keys(impressionsToday);

  if (keys.length === 0) {
    return;
  }

  const existingData = (await Promise.all(([...keys, "all"]).map((key) => db.doc(
    `user-impressions/${userId}-${key}`).get()
  ))).map((doc) => doc.data()?.value);

  const batch = db.batch();

  keys.forEach((key, i) => {
    const existingValue = existingData[i] || [];
    const newData = impressionsToday[key];
    if (newData.length > 0) {
      const existingValueSet = new Set(existingValue);
      const newDataToAdd = newData.filter((d) => !existingValueSet.has(d));

      batch.set(db.doc(`user-impressions/${userId}-${key}`), {
        value: [
          ...newDataToAdd,
          ...existingValue
        ].slice(0, maxNumImpressionsToRememberForKey(key)),
      });
    }
  });

  batch.set(db.doc(`user-impressions/${userId}-all`), {
    value: Array.from(
      new Set([
        ...(existingData[existingData.length - 1] || []),
        ...Object.keys(impressionsToday)
          .filter(k => !IMPRESSION_KEYS_TO_EXCLUDE_FROM_AGGREGATE.has(k))
          .map(k => impressionsToday[k])
          .flat()
      ])
    ).slice(0, MAX_IMPRESSIONS_TO_REMEMBER),
  });

  batch.delete(impressionTodayDoc.ref);

  await batch.commit();
}

const maxNumImpressionsToRememberForKey = (key: string) => {
  if (key === "top") {
    return MAX_TOP_TRACK_IMPRESSIONS_TO_REMEMBER;
  } else if (key === "top-passages") {
    return MAX_TOP_PASSAGE_IMPRESSIONS_TO_REMEMBER;
  } else {
    return MAX_SENTIMENT_IMPRESSIONS_TO_REMEMBER;
  }
}

const getRandomIndexes = (n: number, k: number) => {
  if (k > n) {
    throw Error(`cannot get ${k} indexes less than ${n}`);
  }

  const indexes: number[] = [];

  while (indexes.length < k) {
    const newChoice = Math.floor(Math.random() * n);
    if (!indexes.includes(newChoice)) {
      indexes.push(newChoice);
    }
  }

  return indexes;
}

export const printRecentListens = async (userId: string) => {
  const db = await getFirestoreDb();
  const recentListens = (await db.collection("user-recent-listens").doc(userId).get()).data() ?? {};
  const songsYesterday = recentListens.yesterday?.songs ?? [];
  const songDocs = await db.getAll(...songsYesterday.map((songId: string) => {
    return db.collection("songs").doc(songId);
  }));
  const songs = songDocs.map((doc) => doc.data());
  console.log(JSON.stringify(songs, null, 2));
}