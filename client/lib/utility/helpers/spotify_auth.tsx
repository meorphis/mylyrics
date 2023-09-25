import {useState} from 'react';
import {auth as SpotifyAuth, ApiScope} from 'react-native-spotify-remote';
import {API_HOST} from '../config/api';

const CLIENT_ID: string = '74da9b8462df4dc2b5b6f3a5fc5e622c';
const REDIRECT_PATH: string = 'spotify-auth-callback';

export type SpotifyAuthStatus = 'init' | 'pending' | 'succeeded' | 'failed';

// a hook that returns:
// - a string indicating the status of the spotify oauth process
// - a function to initiate the spotify oauth process
//
// the caller is responsible for determining if we even need to initiate
// the oauth process (i.e. we may already have a token saved for the user)
export const useSpotifyAuthentication = (): [
  SpotifyAuthStatus,
  ({deviceId}: {deviceId: string}) => Promise<void>,
] => {
  const [authStatus, setAuthStatus] = useState<SpotifyAuthStatus>('init');

  const makeRequest = async ({deviceId}: {deviceId: string}) => {
    setAuthStatus('pending');

    const authenticated = await _authenticate({deviceId});

    setAuthStatus(authenticated ? 'succeeded' : 'init');
  };

  return [authStatus, makeRequest];
};

// *** PRIVATE HELPERS ***
const _authenticate = async ({deviceId}: {deviceId: string}) => {
  const spotifyConfig = {
    clientID: CLIENT_ID,
    redirectURL: 'mylyrics://' + REDIRECT_PATH,
    tokenRefreshURL: '',
    tokenSwapURL: `${API_HOST}/swap_spotify_code?userId=${deviceId}`,
    scopes: [ApiScope.UserTopReadScope, ApiScope.UserReadRecentlyPlayedScope],
  };

  try {
    await SpotifyAuth.authorize(spotifyConfig);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
    }
    return false;
  }
};
