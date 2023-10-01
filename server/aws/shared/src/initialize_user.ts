import { getFirestoreDb } from "./integrations/firebase";
import { processOneUser } from "./process_users";
import { createRefreshUserTask } from "./refresh_user";

export const initializeUser = async (
  {userId}: {userId: string}
) => {
  const db = await getFirestoreDb();

  const userData = await db.collection("users").doc(userId).get();

  await processOneUser({
    userId,
    userData,
    includeTopContent: true
  });

  const timestamp = new Date(Date.now());
  const minute = timestamp.getUTCMinutes();
  const previousMinute = minute === 0 ? 59 : minute - 1;

  await db.collection("users").doc(userId).set({
    seed: previousMinute,
  }, {merge: true});

  await createRefreshUserTask({
    userId,
    numRetries: 5,
    alwaysFeatureVeryTopUser: true,
    delaySeconds: 60,
  })
}