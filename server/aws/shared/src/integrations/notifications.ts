import { Recommendation } from "../utility/types";
import Expo from "expo-server-sdk";
import { getFirestoreDb } from "./firebase";

const expo = new Expo();

/// *** PUBLIC INTERFACE ***
// sends the user a push notification with the content of a lyrics recommendation
export const sendRecommendationNotif = async (
  {userId, recommendation}: {userId: string, recommendation: Recommendation}
) => {
  if (!recommendation.analysis) {
    console.log("no analysis for recommendation - returning");
    return;
  }

  const db = await getFirestoreDb();
  const user = await db.collection("users").doc(userId).get();
  const expoPushToken = user.data()?.expoPushToken;

  if (expoPushToken == null) {
    return false;
  }

  const tickets = await expo.sendPushNotificationsAsync([
    {
      to: expoPushToken,
      title: `${recommendation.song.name} by ${recommendation.song.artists[0].name}`,
      sound: "default",
      body: recommendation.analysis,
      data: {
        songName: recommendation.song.name,
        artistName: recommendation.song.artists[0].name,
        colors: recommendation.song.album.image.colors
      }
    },
  ]);

  if (tickets.length !== 1) {
    throw Error("invalid expo receipts length");
  }

  const ticket = tickets[0];

  console.log(JSON.stringify(ticket));

  if (ticket.status === "error") {
    throw Error("expo receipt error");
  }

  await db.collection("expo-push-receipts").doc(ticket.id).set({
    deviceId: userId,
    receiptId: ticket.id,
    time: Date.now(),
    consumed: false,
    source: "pushMessage",
    content: recommendation.analysis,
  });

  return true;
}
