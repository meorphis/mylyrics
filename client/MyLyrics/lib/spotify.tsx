import * as AuthSession from "expo-auth-session";
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { useEffect } from 'react';

import {
  auth as SpotifyAuth,
  remote as SpotifyRemote,
  ApiScope,
  ApiConfig,
} from "react-native-spotify-remote";

const scopesArr = [
  "user-read-currently-playing",
  "user-top-read"
];
const spotifyClientId : string = "74da9b8462df4dc2b5b6f3a5fc5e622c";
const redirectPath : string = "spotify-auth-callback";

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

// Api Config object, replace with your own applications client id and urls
const spotifyConfig: ApiConfig = {
  clientID: "74da9b8462df4dc2b5b6f3a5fc5e622c",
  redirectURL: makeRedirectUri({path: redirectPath}),
  tokenRefreshURL: "",
  tokenSwapURL: "",
  scopes: [ApiScope.AppRemoteControlScope, ApiScope.UserReadCurrentlyPlayingScope, ApiScope.UserTopReadScope],
};

export const useSpotifyAuthentication = (): [
  boolean,
  () => Promise<void>
] => {
  const [webRequest, makeWebRequest] = useWebSpotifyAuthentication();
  const makeRequest = async () => {
    const isSpotifyInstalled = await Linking.canOpenURL('spotify:');
    if (true) {
      const session = await SpotifyAuth.authorize(spotifyConfig);
    }
    else {
    }
  };

  return [webRequest != null, makeRequest];
} 

export const useWebSpotifyAuthentication = (): [
  AuthSession.AuthRequest | null,
  (
    options?: AuthSession.AuthRequestPromptOptions | undefined
  ) => Promise<AuthSession.AuthSessionResult>
] => {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: spotifyClientId,
      scopes: scopesArr,
      usePKCE: true,
      redirectUri: makeRedirectUri({path: redirectPath}),
    },
    discovery
  );

  useEffect(() =>  {
    if (response?.type === "success") {

      const { code } = response.params;

      if (code != null) {
        makeGrantRequest({code, codeVerifier: request?.codeVerifier!});
      }
    }
  }, [response]);

  return [request, promptAsync];
};

// // when the user is redirected back to the app from the Spotify app,
// // get the code from the url and exchange it for an access token
// Linking.addEventListener('url', async (event) => {
//   const url = new URL(event.url);
//   if (url.pathname === makeRedirectUri({path: redirectPath})) {
//     const code = url.searchParams.get('code');
    
//     if (code != null) {
//       makeGrantRequest({code, codeVerifier: ""});
//     }
//   }
// });

const makeGrantRequest = async ({code, codeVerifier} : {code: string, codeVerifier: string}) => {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const params = {
    code: code,
    redirect_uri: makeRedirectUri({path: redirectPath}),
    grant_type: 'authorization_code',
    client_id: spotifyClientId,
    code_verifier: codeVerifier,
  };
  console.log(params);
  fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    // body:
    //   'grant_type=authorization_code' + 
    //   '&code=' + code +
    //   '&redirect_uri=' + makeRedirectUri({path: redirectPath}) +
    //   '&client_id=' + spotifyClientId +
    //   '&code_verifier=' + codeVerifier,
    body: new URLSearchParams(params).toString(),
  }).then(response => response.json()).then(responseJson => {
    if (responseJson.type === 'success') {
      const token = responseJson.accessToken;
      // Use the token to make requests to the Spotify API
      console.log(token);
    } else {
      console.log(responseJson);
    }
  });
}