import { getFirestoreDb } from "./integrations/firebase";
import { getRecommendationsForSentiments } from "./integrations/open_search";
import { Recommendation } from "./utility/types";
import {FieldValue} from "firebase-admin/firestore";

// *** PUBLIC INTERFACE ***
// adds recommendations for a user that has already been provided with recommendations
// for a primary sentiment but is browsing other sentiments; because passages have
// multiple sentiments, it's possible that the user already has some recommendations
// for this one - we filter those out so that they don't see duplicates
export const getAdditionalRecommendations = async (
  {userId, sentiment}: {userId: string, sentiment: string}
): Promise<Recommendation[]> => {
  const db = await getFirestoreDb();
  // const data = (await db.collection("user-recommendations").doc(userId).get()).data();
  // if (!data) {
  //   throw Error("cannot add recommendations for a user that does not already have some")
  // }

  // const existingRecommendations: Recommendation[] = data.recommendations;
  // const recommendationsForSentiment = existingRecommendations.filter((recommendation) => {
  //   return recommendation.tags.some((tag) => tag.sentiment === sentiment);
  // });

  // const numberOfRecommendationsNeeded = (
  //   NUMBER_OF_RECOMMENDATIONS_FOR_SECONDARY_SENTIMENTS - recommendationsForSentiment.length
  // )

  // if (numberOfRecommendationsNeeded <= 0) {
  //   return [];
  // }

  // // for songs, we don't want at recommend any songs twice across sentiments
  // const currentlyRecommendedSongIds = existingRecommendations.map(
  //   (recommendation) => recommendation.song.id
  // );
  // // for artists, just avoid duplicates within a sentiment
  // const currentlyRecommendedArtistIds = recommendationsForSentiment.map(
  //   (recommendation) => recommendation.song.artists[0].id
  // );
  const newRecommendations = await getRecommendationsForSentiments({
    userId,
    sentiments: [sentiment],
    // currentlyRecommendedSongIds,
    // currentlyRecommendedArtistIds,
  });

  const recommendations = await db.runTransaction(async (transaction) => {
    const docRef = db.collection("user-recommendations").doc(userId);
    const doc = await transaction.get(docRef);
    const data = doc.data() || {};
    const existingRecommendations = data.recommendations || [];

    // it's possible that a concurrent request already added one of our recommendations
    // so we filter out any that are already in the db, within the transaction
    const recommendationsToAdd = newRecommendations.filter((newRecommendation) => {
      return !existingRecommendations.some((existingRecommendation: Recommendation) => {
        return existingRecommendation.song.id === newRecommendation.song.id;
      });
    });

    if (recommendationsToAdd.length === 0) {
      return [];
    }

    transaction.update(docRef, {
      recommendations: FieldValue.arrayUnion(...recommendationsToAdd),
    });

    return recommendationsToAdd;
  });

  return recommendations;
}
