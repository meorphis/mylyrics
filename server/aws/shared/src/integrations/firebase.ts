import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getSecretString } from "./aws";
import { cachedFunction } from "../utility/cache";

// *** CONSTANTS ***
// the private key is also needed, but it is stored in aws secrets manager
const FIREBASE_CONFIG = {
  projectId: "mylyrics-391520",
  clientEmail: "firebase-adminsdk-ickxx@mylyrics-391520.iam.gserviceaccount.com"
}

// *** PUBLIC INTERFACE ***
// returns a cache instance of firestore with admin privileges
const _getFirestoreDb = async () => getFirestore(await getFirebaseApp());
export const getFirestoreDb = cachedFunction(_getFirestoreDb); 

// *** PRIVATE HELPERS ***
const _getFirebaseApp = async () => {
  const privateKey = atob(await getSecretString("firebasePrivateKeyB64"));

  return admin.initializeApp({
    credential: admin.credential.cert({
      ...FIREBASE_CONFIG,
      privateKey,
    })
  });
}
const getFirebaseApp = cachedFunction(_getFirebaseApp);

