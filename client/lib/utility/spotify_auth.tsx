import {useState} from 'react';
import {auth as SpotifyAuth, ApiScope} from 'react-native-spotify-remote';
// import { firebaseDb } from "./firebase";
// import { setDoc, doc } from "firebase/firestore";
// import {useDeviceId} from './device_id';

// *** CONSTANTS ***
// const SCOPES = ['user-read-currently-playing', 'user-top-read'];
const CLIENT_ID: string = '74da9b8462df4dc2b5b6f3a5fc5e622c';
const REDIRECT_PATH: string = 'spotify-auth-callback';
// const AUTHORIZATION_ENDPOINT: string = 'https://accounts.spotify.com/authorize';
// const TOKEN_ENDPOINT: string = 'https://accounts.spotify.com/api/token';

// *** PUBLIC INTERFACE ***
export type SpotifyAuthStatus = 'init' | 'pending' | 'succeeded' | 'failed';

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
  ({deviceId}: {deviceId: string}) => Promise<void>,
] => {
  const [authStatus, setAuthStatus] = useState<SpotifyAuthStatus>('init');
  const makeRequest = async ({deviceId}: {deviceId: string}) => {
    setAuthStatus('pending');

    await authenticateNatively({deviceId});

    setAuthStatus('succeeded');
  };

  return [authStatus, makeRequest];
};

// *** PRIVATE HELPERS ***
const authenticateNatively = async ({deviceId}: {deviceId: string}) => {
  const spotifyConfig = {
    clientID: CLIENT_ID,
    redirectURL: 'mylyrics://' + REDIRECT_PATH,
    tokenRefreshURL: '',
    tokenSwapURL: 'http://172.20.10.3:3000?userId=' + deviceId,
    scopes: [
      ApiScope.AppRemoteControlScope,
      ApiScope.UserTopReadScope,
      ApiScope.UserReadRecentlyPlayedScope,
    ],
  };

  await SpotifyAuth.authorize(spotifyConfig);
};
