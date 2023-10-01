import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { getFirestoreDb } from "./integrations/firebase";
import { getScoredSentiments, getDailyRecommendations } from "./integrations/open_search";
import { 
  GROUP_TO_SENTIMENTS, SENTIMENT_TO_GROUP, getSentimentValue 
} from "./utility/sentiments";
import { sqs } from "./integrations/aws";
import { sendRecommendationNotif } from "./integrations/notifications";
import { getTopArtistsForUser } from "./integrations/spotify/spotify_data";
import { getFreshSpotifyResponse } from "./integrations/spotify/spotify_auth";
import { Artist, Recommendation } from "./utility/types";

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

  let featuredArtistOptions: Artist[];

  if (alwaysFeatureVeryTopArtist) {
    featuredArtistOptions = topSpotifyArtists.slice(0, 3);
  } else {
    const artistsEligibleForFeature = topSpotifyArtists.filter((artist) => {
      return !recentlyFeaturedArtists.includes(artist.id);
    });
    featuredArtistOptions = getRandomIndexes(
      artistsEligibleForFeature.length,
      Math.min(artistsEligibleForFeature.length, 3)
    ).map(idx => artistsEligibleForFeature[idx])
  }

  const {recommendations, featuredArtist} = await getDailyRecommendations(
    {
      userId,
      recentListens,
      topSpotifyArtists,
      featuredArtistOptions,
      recommendedSentiments,
    }
  );

  if (recommendations.length === 0) {
    console.log(`no recommendations for sentiments ${recommendedSentiments} for user ${userId}`);
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
        ...(featuredArtist ? [featuredArtist.id] : []),
        ...userRecommendations.featuredArtistHistory || [],
      ].slice(0, MAX_FEATURED_ARTISTS_TO_REMEMBER),
    }, {merge: true}),
    sendRecommendationNotif({recommendation: reorderedRecommendations[0], userId}),
  ]);
};

// creates a task to run refreshUser
export const createRefreshUserTask = async (
  {userId, numRetries = 0, alwaysFeatureVeryTopArtist = false, delaySeconds}:
  {userId: string, numRetries?: number, alwaysFeatureVeryTopArtist?: boolean, delaySeconds?: number}
) => {

  try {
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.REFRESHUSERQUEUE_QUEUE_URL as string,
      MessageBody: JSON.stringify({
        userId,
        numRetries,
        alwaysFeatureVeryTopArtist,
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
  const impressionsToday = (impressionTodayDoc.data()?.value || {}) as Record<string, string[]>;

  const keys = Object.keys(impressionsToday);
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

// gets a list of sentiments that are highly represented in the user's recent listening activity
// we generally enforce the following constraints (unless we don't have enough eligible recs):
// - we will recommend sentiments from three groups, with two or three sentiments each (three if
//    possible)
// - at least two of these groups will be "non-negative", meaning at least two of their sentiments
//    are positive or mixed
// - we weigh each group according to the sum of the squares of the scores of its eligible
//    sentiments with a downrank factor for groups that have been recommended recently
const getRecommendedSentiments = async (
  {userId, previouslyRecommendedSentiments, recentListens} : 
  {
    userId: string,
    previouslyRecommendedSentiments?: Record<string, string[]>
    recentListens: Record<string, {songs: Array<string>, artists: Array<string>} | undefined>,
  },
): Promise<string[] | null> => {
  const scoredSentiments = await getScoredSentiments({userId, recentListens});

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
  if (previouslyRecommendedSentiments) {
    const previousGroups = Object.keys(previouslyRecommendedSentiments);

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
    const options = scoredSentiments.reduce((acc, {sentiment, score}) => {
      if (groupSentiments.includes(sentiment)) {
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

const findRecommendationsIndexForNotif = ({
  recommendations,
  notificationHistory,
}: {
  recommendations: Recommendation[],
  notificationHistory: Set<string>,
}) => {


  const topPassageIndex = recommendations.findIndex(
    (r) => !notificationHistory.has(r.song.id) && r.type === "top"
  );

  if (topPassageIndex !== -1) {
    return topPassageIndex;
  }

  const featuredArtistIndex = recommendations.findIndex(
    (r) => !notificationHistory.has(r.song.id) && r.type === "artist"
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

const getRandomIndexes = (n: number, k: number) => {
  if (k > n) {
    throw Error(`cannot get ${k} indexes less than ${n}`);
  }

  const indexes: number[] = [];

  while (indexes.length < k) {
    const newChoice = Math.floor(Math.random() * n);
    if (indexes.includes(newChoice)) {
      indexes.push(newChoice);
    }
  }

  return indexes;
}