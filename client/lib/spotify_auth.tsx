import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { isExpoGo } from './utility';
// import { firebaseDb } from "./firebase";
// import { setDoc, doc } from "firebase/firestore";
import { useDeviceId } from "./device_id";

// *** CONSTANTS ***
const SCOPES = [
  "user-read-currently-playing",
  "user-top-read"
];
const CLIENT_ID : string = "74da9b8462df4dc2b5b6f3a5fc5e622c";
const REDIRECT_PATH : string = "spotify-auth-callback";
const AUTHORIZATION_ENDPOINT: string = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT: string = "https://accounts.spotify.com/api/token";

// *** PUBLIC INTERFACE ***
export type SpotifyAuthStatus = "init" | "pending" | "succeeded" | "failed";

// a hook that returns:
// - a string indicating the status of the spotify oauth process
// - a function to initiate the spotify oauth process
//
// notes:
// - if possible, we use the native spotify sdk to authenticate because
//    this will deep link into the spotify app; however in cases where
//    this is not possible (e.g. in expo go or if the user does not have
//    this spotify app), we use the web-based oauth flow
// - the caller is responsible for determining if we even need to initiate
//    the oauth process (i.e. we may already have a token saved for the user)
export const useSpotifyAuthentication = (): [
  SpotifyAuthStatus,
  () => Promise<void>
] => {
  const [authStatus, setAuthStatus] = useState<SpotifyAuthStatus>("init");
  const [webAuthStatus, authenicateWithWeb] = useWebAuthentication();
  const deviceId = useDeviceId();

  // if we're authenticating with web, keep the auth status state in sync with
  // the web auth status
  useEffect(() => {
    if (webAuthStatus !== "init" && authStatus !== webAuthStatus) {
      setAuthStatus(webAuthStatus)
    }
  }, [webAuthStatus])

  const makeRequest = async () => {
    setAuthStatus("pending");

    if (isExpoGo) {
      // we cannot authenticate natively because the native library is not available
      // in expo go, so we must use the web-based oauth flow
      await authenicateWithWeb({deviceId});
    } else {
      try {
        await authenticateNatively({deviceId});
      } catch (err) {
        // for instance, maybe the user doesn't have the spotify app installed
        await authenicateWithWeb({deviceId});
      }
    }

    // if we haven't hit an error and our future has completed, we've succeeded
    setAuthStatus("succeeded")
  };

  return [authStatus, makeRequest];
}

// *** PRIVATE HELPERS ***
const useWebAuthentication = (): [
  SpotifyAuthStatus,
  ({deviceId} : {deviceId: string }) => Promise<void>
] => {
  const [authStatus, setAuthStatus] = useState<SpotifyAuthStatus>("init");

  const [request, _, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      usePKCE: true,
      redirectUri: makeRedirectUri({path: REDIRECT_PATH}),
    },
    {
      authorizationEndpoint: AUTHORIZATION_ENDPOINT
    }
  );

  const authenticate = async ({deviceId} : {deviceId: string}) => {
    setAuthStatus("pending");
    const response = await promptAsync();
    if (response?.type === "success") {
      const { code } = response.params;
      if (code != null) {
        makeGrantRequest({deviceId, code, codeVerifier: request?.codeVerifier!}).then(() => {
          setAuthStatus("succeeded");
        }).catch((err) => {
          setAuthStatus("failed");
          throw err;
        });
      }
    } else if (response?.type === "error") {
      setAuthStatus("failed");
    }
  }

  return [
    authStatus,
    authenticate
  ];
};

const authenticateNatively = async ({deviceId} : {deviceId : string}) => {
  const {
    auth: SpotifyAuth,
    ApiScope,
  } = require('react-native-spotify-remote');

  const spotifyConfig = {
    clientID: CLIENT_ID,
    redirectURL: makeRedirectUri({path: REDIRECT_PATH}),
    tokenRefreshURL: "",
    tokenSwapURL: "",
    scopes: [ApiScope.AppRemoteControlScope, ApiScope.UserReadCurrentlyPlayingScope, ApiScope.UserTopReadScope],
  };

  const session = await SpotifyAuth.authorize(spotifyConfig);
  const {accessToken, refreshToken, expirationDate} = session;
  saveSpotifyAuth({
    deviceId,
    accessToken,
    refreshToken,
    expirationTime: expirationDate.getTime(),
  })
}

const makeGrantRequest = async ({deviceId, code, codeVerifier} : {deviceId: string, code: string, codeVerifier: string}) => {
  const params = {
    code: code,
    redirect_uri: makeRedirectUri({path: REDIRECT_PATH}),
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  };

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  
  if (response.status === 200) {
    const responseJson = await response.json();

    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      error,
    } = responseJson;

    saveSpotifyAuth({
      deviceId,
      accessToken,
      refreshToken,
      expirationTime: new Date().getTime() + expiresIn * 1000,
    })
  }
}

const saveSpotifyAuth = async ({deviceId, accessToken, refreshToken, expirationTime} : {deviceId: string, accessToken: string, refreshToken: string, expirationTime: number}) => {
  // await setDoc(doc(firebaseDb, "users", deviceId), {
  //   deviceId,
  //   spotifyAuth: {
  //     accessToken,
  //     refreshToken,
  //     expirationTime,
  //   },
  // },
  // {
  //   merge: true
  // });
}