import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { getFirestoreDb } from "./integrations/firebase";
import { getScoredSentiments, getDailyRecommendations } from "./integrations/open_search";
import { SENTIMENT_GROUPS, SENTIMENT_TO_GROUP } from "./utility/sentiments";
import { sqs } from "./integrations/aws";
import { sendRecommendationNotif } from "./integrations/notifications";
import { getTopArtistsForUser } from "./integrations/spotify/spotify_data";
import { getFreshSpotifyResponse } from "./integrations/spotify/spotify_auth";
import { Recommendation } from "./utility/types";

// *** CONSTANTS ***
// recent listens: note that recent listen limits are not hard limits - we never delete records from
// the last week, only earlier than that
const MAX_NUM_SONGS_TO_REMEMBER = 5000;
const MAX_NUM_ARTISTS_TO_REMEMBER = 250;

// impressions: we keep track of impressions for each sentiment, for all sentiments, and for top
// tracks; these are hard limits
const MAX_IMPRESSIONS_TO_REMEMBER = 5000;
const MAX_SENTIMENT_IMPRESSIONS_TO_REMEMBER = 250;
// we only use the first 50 of these, but we keep more in case we want to change this logic later
const MAX_TOP_TRACK_IMPRESSIONS_TO_REMEMBER = 250;

const MAX_NOTIFICATIONS_TO_REMEMBER = 500;
const MAX_FEATURED_ARTISTS_TO_REMEMBER = 10;

// *** PUBLIC INTERFACE ***
// run daily (or as part of NUX) to give the user new content for the day
// - updates the user's recent listens data to mark the passage of a new day
// - finds the user's recommended sentiments
// - puts the most relevant passages for the top sentiment in the user's recommendations
// - sends a notification to the user with the top recommendation
export const refreshUser = async ({
  userId, numRetries, alwaysFeatureVeryTopArtist = false
} : {userId: string, numRetries: number, alwaysFeatureVeryTopArtist?: boolean}) => {
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
    sentiments,
  } = userRecommendations;

  // this shouldn't happen, but if we somehow create a task for a user that already has
  // recommendations for today, don't do anything
  if (
    lastRefreshedAt != null &&
    lastRefreshedAt > Date.now() - 23.5 * 60 * 60 * 1000
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
    lastPushedBackRecentPlaysAt < Date.now() - 23.5 * 60 * 60 * 1000
  ) {
    console.log(`pushing back recent plays for user ${userId}`);
    promises.push(pushBackUserRecentListens({userId}));
  } else {
    console.log(`recent plays already pushed back for user ${userId}`);
  }

  await Promise.all(promises);

  const recentListens = (await db.collection("user-recent-listens").doc(userId).get()).data() ?? {};

  const recommendedSentiments = await getRecommendedSentiments({
    userId,
    previouslyRecommendedSentiments: sentiments,
    recentListens,
  });

  console.log(
    `recommended sentiments for user ${userId}: ${JSON.stringify(recommendedSentiments)}`
  );

  if (!recommendedSentiments || Object.values(recommendedSentiments).flat().length === 0) {
    console.log(`no recommended sentiments for user ${userId}`);
    if (numRetries > 0) {
      console.log(`retrying in 60 seconds for user ${userId}`);
      await createRefreshUserTask({userId, numRetries: numRetries - 1, delaySeconds: 60});
    }
    return;
  }

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
  
  const {access_token: spotifyAccessToken} = spotifyResponse.data;
  
  const recentlyFeaturedArtists = userRecommendations.featuredArtistHistory ?? [];
  const topSpotifyArtists = await getTopArtistsForUser({spotifyAccessToken, limit: 15});

  let featuredArtist;

  if (alwaysFeatureVeryTopArtist) {
    featuredArtist = topSpotifyArtists[0];
  } else {
    const artistsEligibleForFeature = topSpotifyArtists.filter((artist) => {
      return !recentlyFeaturedArtists.includes(artist.id);
    });
    featuredArtist = artistsEligibleForFeature[
      Math.floor(Math.random() * artistsEligibleForFeature.length)
    ];
  }

  const flatSentiments = recommendedSentiments.map((s) => s.sentiments).flat();

  const recommendations = await getDailyRecommendations(
    {
      userId,
      recentListens,
      topSpotifyArtists,
      featuredArtist,
      recommendedSentiments: flatSentiments,
    }
  );

  if (recommendations.length === 0) {
    console.log(`no recommendations for sentiments ${flatSentiments} for user ${userId}`);
    return;
  }

  const recommendationIndex = findRecommendationsIndexForNotif({
    recommendations,
    notificationHistory: new Set(userRecommendations.notificationHistory ?? []),
  });

  const reorderedRecommendations = [
    recommendations[recommendationIndex],
    ...recommendations.slice(0, recommendationIndex),
    ...recommendations.slice(recommendationIndex + 1),
  ]

  await Promise.all([
    db.collection("user-recommendations").doc(userId).set({
      recommendations: reorderedRecommendations,
      sentiments: recommendedSentiments,
      lastRefreshedAt: Date.now(),
      notificationHistory: [
        reorderedRecommendations[0].song.id,
        ...userRecommendations.notificationHistory || [],
      ].slice(0, MAX_NOTIFICATIONS_TO_REMEMBER),
      featuredArtistHistory: [
        featuredArtist.id,
        ...userRecommendations.featuredArtistHistory || [],
      ].slice(0, MAX_FEATURED_ARTISTS_TO_REMEMBER),
    }, {merge: true}),
    sendRecommendationNotif({recommendation: reorderedRecommendations[0], userId}),
  ]);
};

// creates a task to run refreshUser
export const createRefreshUserTask = async (
  {userId, numRetries = 0, alwaysFeatureVeryTopUser = false, delaySeconds}:
  {userId: string, numRetries?: number, alwaysFeatureVeryTopUser?: boolean, delaySeconds?: number}
) => {

  try {
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.REFRESHUSERQUEUE_QUEUE_URL as string,
      MessageBody: JSON.stringify({
        userId,
        numRetries,
        alwaysFeatureVeryTopUser,
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
    const update: Record<string, {songs: Array<string>, artists: Array<string>}> = {
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
  const impressionsToday = impressionTodayDoc.data()?.value || {};

  const keys = Object.keys(impressionsToday);
  const existingData = (await Promise.all(([...keys, "all"]).map((key) => db.doc(
    `user-impressions/${userId}-${key}`).get()
  ))).map((doc) => doc.data()?.value);

  const batch = db.batch();
  keys.forEach((key, i) => {
    const existingValue = existingData[i] || [];
    const newData = impressionsToday[key];
    if (newData.length > 0) {
      batch.set(db.doc(`user-impressions/${userId}-${key}`), {
        value: Array.from(
          new Set([...existingValue, ...newData])
        ).slice(
          0, key === "top" ? MAX_TOP_TRACK_IMPRESSIONS_TO_REMEMBER :
            MAX_SENTIMENT_IMPRESSIONS_TO_REMEMBER
        ),
      });
    }
  });

  batch.set(db.doc(`user-impressions/${userId}-all`), {
    value: Array.from(
      new Set([
        ...(existingData[existingData.length - 1] || []),
        ...Object.values(impressionsToday).flat()
      ])
    ).slice(0, MAX_IMPRESSIONS_TO_REMEMBER),
  });

  batch.delete(impressionTodayDoc.ref);

  await batch.commit();
}

// gets a map from group -> sentiment comprised of sentiments that are highly represented
// in the user's recent listening activity
const getRecommendedSentiments = async (
  {userId, previouslyRecommendedSentiments, recentListens} : 
  {
    userId: string,
    previouslyRecommendedSentiments?: Record<string, string[]>
    recentListens: Record<string, {songs: Array<string>, artists: Array<string>} | undefined>,
  },
): Promise<{group: string, sentiments: string[]}[] | null> => {
  const scoredSentiments = await getScoredSentiments({userId, recentListens});

  if (scoredSentiments.length === 0) {
    console.log(`no scored sentiments for user ${userId}`);
    return null;
  }

  // if no sentiment has been expressed more than 5 times, don't recommend anything
  const sortedByCount = scoredSentiments.sort((a, b) => b.count - a.count);
  if (sortedByCount[0].count < 5) {
    console.log(`no sentiment expressed more than 5 times for user ${userId}`);
    return null;
  }

  const groupScores = sortedByCount.reduce((acc, {sentiment, score}) => {
    const group = SENTIMENT_TO_GROUP[sentiment];
    acc[group] = (acc[group] || 0) + score * score;
    return acc;
  }, {} as Record<string, number>);

  // downrank groups that have been recommended recently
  if (previouslyRecommendedSentiments) {
    const previousGroups = Object.keys(previouslyRecommendedSentiments);

    previousGroups.forEach((group, i) => {
      groupScores[group] = (groupScores[group] || 0) / Math.pow(2, previousGroups.length - i);
    })
  }

  const groups = multiWeightedRandomChoice(groupScores, 3);

  // if there are fewer than 3 groups, don't recommend anything
  if (groups.length < 3) {
    console.log(`not enough groups to make recommendation for ${userId}: ${groups}`);
    return null;
  }

  const sentiments = groups.map((group) => {
    const groupSentiments = SENTIMENT_GROUPS[group as keyof typeof SENTIMENT_GROUPS];
    const options = scoredSentiments.reduce((acc, {sentiment, score}) => {
      if (groupSentiments.includes(sentiment)) {
        acc[sentiment] = score;
      }
      return acc;
    }, {} as Record<string, number>);
    const sentiments = multiWeightedRandomChoice(options, 3);
    return {
      group,
      sentiments,
    };
  });

  return sentiments;
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

const findRecommendationsIndexForNotif = ({
  recommendations,
  notificationHistory,
}: {
  recommendations: Recommendation[],
  notificationHistory: Set<string>,
}) => {


  const topPassageIndex = recommendations.findIndex(
    (r) => !notificationHistory.has(r.song.id) && r.type === "top_passage"
  );

  if (topPassageIndex !== -1) {
    return topPassageIndex;
  }

  const featuredArtistIndex = recommendations.findIndex(
    (r) => !notificationHistory.has(r.song.id) && r.type === "featured_artist"
  );

  if (featuredArtistIndex !== -1) {
    return featuredArtistIndex;
  }

  const sentimentIndex = recommendations.findIndex(
    (r) => !notificationHistory.has(r.song.id) && r.type === "sentiment"
  );

  if (sentimentIndex !== -1) {
    return sentimentIndex;
  }

  // unlikely, but if we've already sent every rec as a notif, just send the first one again
  return 0;
}