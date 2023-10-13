import { FieldValue } from "firebase-admin/firestore";
import { getFirestoreDb } from "./integrations/firebase";
import { lookupPassage } from "./integrations/open_search/passages";

// *** PUBLIC INTERFACE ***
// Used ad hoc to look up a specific passage and add it to a bundle
export const addPassageToBundle = async (
  {bundleId, songName, artistName, lineNumbers}:
  {
    bundleId: string,
    songName: string,
    artistName: string,
    lineNumbers: {start: number, end: number}
  }
) => {
  const recommendation = await lookupPassage({songName, artistName, lineNumbers});
  if (recommendation == null) {
    console.log("no recommendation found");
    return
  }

  console.log(JSON.stringify(recommendation));

  const db = await getFirestoreDb();
  const bundleRef = db.collection("bundles").doc(bundleId);

  await bundleRef.update({
    passages: FieldValue.arrayUnion(recommendation),
  });
}