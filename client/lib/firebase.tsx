// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
import * as Device from "expo-device";
import Constants from "expo-constants";

// *** CONSTANTS ***
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBGlfL4EDUR-u2oZguev65EpFrLFUHB1-s",
    authDomain: "mylyrics-391520.firebaseapp.com",
    projectId: "mylyrics-391520",
    storageBucket: "mylyrics-391520.appspot.com",
    messagingSenderId: "757169309531",
    appId: "1:757169309531:web:02f9cdc2962c7365b2bc7e",
    measurementId: "G-RD0V8LZ516"
  };

// *** PUBLIC INTERFACE ***
// export const firebaseApp = initializeApp(FIREBASE_CONFIG);
// export const firebaseDb = getFirestore(firebaseApp);
// export const firebaseOrigin =
//   Device.osName === "iOS"
//     ? Constants.manifest?.debuggerHost?.split(":").shift() || "localhost"
//     : "192.168.1.180";