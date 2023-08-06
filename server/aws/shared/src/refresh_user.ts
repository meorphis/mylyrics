import { getFirestoreDb } from "./integrations/firebase";
import { getRecommendationsForSentiment } from "./integrations/open_search";
import { NUMBER_OF_RECOMMENDATIONS_FOR_MAIN_SENTIMENT } from "./utility/recommendations";

// *** CONSTANTS ***
// note that these are not hard limits - we never delete records from the last week, only
// earlier than that
// const MAX_NUM_SONGS_TO_REMEMBER = 5000;
// const MAX_NUM_ARTISTS_TO_REMEMBER = 250;

// *** PUBLIC INTERFACE ***
// run daily (or as part of NUX) to give the user new content for the day
// - updates the user's recent listens data to mark the passage of a new day
// - finds the user's sentiment themes
// - puts the most relevant passages for each sentiment in the user's recommendations
// - sends a notification to the user
export const refreshUser = async ({userId} : {userId: string}) => {
  // await pushBackUserRecentListens({userId});

  const sentiment = "lonely";

  const recommendations = await getRecommendationsForSentiment(
    {userId, sentiment, limit: NUMBER_OF_RECOMMENDATIONS_FOR_MAIN_SENTIMENT}
  );

  const db = await getFirestoreDb();
  await db.collection("user-recommendations").doc(userId).set({
    recommendations,
    sentiment,
    lastRefreshTime: Date.now(),
  });
};

// // *** PRIVATE HELPERS ***
// // for a given user, we essentially acknowledge that it is a new day
// // all of the records of when they listened to songs and artists are moved back one day
// // on the whole, we retain songs and artists from:
// // - today
// // - yesterday
// // - N days ago for N between 2 and 8
// // - longer ago, up to a limit
// const pushBackUserRecentListens = async (
//   {userId} : {userId: string},
// ) => {
//   const db = await getFirestoreDb();
//   return await db.runTransaction(async (transaction) => {
//     const docRef = db.collection("user-recent-listens").doc(userId);
//     const doc = await transaction.get(docRef);
//     const data = doc.data() || {};
//     const today = data.today || {};
//     const yesterday = data.yesterday || {};
//     const daysago = [2, 3, 4, 5, 6, 7, 8].map((daysAgo) => {
//       return data[`daysago-${daysAgo}`] || {};
//     });
//     const longerAgo = data.longerAgo || {};
  
//     const totalNumSongs = [
//       today.songs?.length || 0,
//       yesterday.songs?.length || 0,
//       ...daysago.map((day) => day.songs?.length || 0),
//       longerAgo.songs?.length || 0,
//     ].reduce((a, b) => a + b, 0);
  
//     const totalNumArtists = [
//       today.artists?.length || 0,
//       yesterday.artists?.length || 0,
//       ...daysago.map((day) => day.artists?.length || 0),
//       longerAgo.artists?.length || 0,
//     ].reduce((a, b) => a + b, 0);
  
//     const numSongsToRemove = Math.max(0, totalNumSongs - MAX_NUM_SONGS_TO_REMEMBER);
//     const numArtistsToRemove = Math.max(0, totalNumArtists - MAX_NUM_ARTISTS_TO_REMEMBER);
      
//     const newLongerAgoSongs = [
//       ...daysago[-1]?.songs || [],
//       ...longerAgo.songs || [],
//     ];
      
//     const newLongerAgoArtists = [
//       ...daysago[-1]?.artists || [],
//       ...longerAgo.artists || [],
//     ];
  
//     const newLongerAgo = {
//       // if the total number of songs is greater than the limit, remove the difference
//       songs: newLongerAgoSongs.slice(
//         0, newLongerAgoSongs.length - numSongsToRemove
//       ),
//       // similar for artists
//       artists: newLongerAgoArtists.slice(
//         0, newLongerAgoArtists.length - numArtistsToRemove
//       ),
//     };
//     const update: Record<string, {songs: Array<string>, artists: Array<string>}> = {
//       today: daysago[0],
//       yesterday: today,
//       "daysago-2": yesterday,
//       longerAgo: newLongerAgo,
//     }
  
//     daysago.slice(0, -1).forEach((day, i) => {
//       update[`daysago-${i + 3}`] = day;
//     });
  
//     transaction.set(docRef, update);

//     return update;
//   });
// }
  