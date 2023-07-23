import axios from "axios";
import { getSecretString } from "../aws";
import { getFirestoreDb } from "../firebase";
import { encrypt, decrypt } from "../../utility/encryption";
import { DocumentData } from "firebase-admin/firestore";

// *** CONSTANTS AND TYPES ***
// public ID, ok to leave in code
export const SPOTIFY_CLIENT_ID = "74da9b8462df4dc2b5b6f3a5fc5e622c";
export const SPOTIFY_REDIRECT_URL = "mylyrics://spotify-auth-callback";

type SpotifyAPIResponse = {
  status: 200,
  data: {
    access_token: string,
    token_type: string,
    scope: string,
    expires_in: number,
    refresh_token: string,
  },
} | {
  status: 400 | 500,
  data: {
    error: string,
    error_description: string,
  }
}

// *** PUBLIC INTERFACE ***
// takes a userId string and a code that was received from the spotify api and returns
// a spotify api response
export const swapCodeForSpotifyResponse = async (
  {userId, code} : {userId: string, code: string}
): Promise<SpotifyAPIResponse | null> => {
  return makeSpotifyAuthRequest(
    {
      userId,
      paramString: `grant_type=authorization_code&code=${code}&redirect_uri=${SPOTIFY_REDIRECT_URL}`
    }
  )
}

// takes a settings object for a user and returns a spotify API response with a fresh access token
// (or null if the user is authenticated with spotify)
//
// notes:
// - this function will save the information from the spotify api response to the
//      user's settings
// - if the access token that is stored in the user's settings is expired
//      or about to expire, this function will invoke the spotify api to get
//      a new one and update the user's settings
// - otherwise, it will return the existing access token
// - if no access token is stored in the user's settings, this function
//      will return null
export const getFreshSpotifyResponse = async (
  userObj: DocumentData
) : Promise<SpotifyAPIResponse | null> => {
  if (userObj.userId == null) {
    throw Error(`missing ID for user object: ${JSON.stringify(userObj)}`);
  }

  // if the user has not authenticated with spotify, there's no way to get a token
  const existingSpotifyAuth = userObj.spotifyAuth;
  if (existingSpotifyAuth == null) {
    return null;
  }

  // the token will still be valid more than one minute from now, which
  // is good enough for our purposes
  if (existingSpotifyAuth.expirationTime as number > Date.now() + 60 * 1000) {
    return {
      status: 200,
      data: {
        access_token: existingSpotifyAuth.accessToken,
        token_type: "Bearer",
        scope: existingSpotifyAuth.scope,
        expires_in: Date.now() - existingSpotifyAuth.expirationTime,
        refresh_token: "[REDACTED]"
      }
    }
  }

  return await makeSpotifyAuthRequest({
    userId: userObj.userId,
    // eslint-disable-next-line max-len
    paramString: `grant_type=refresh_token&refresh_token=${(await decrypt(existingSpotifyAuth.encryptedRefreshToken))}`,
    existingEncrypedRefreshToken: existingSpotifyAuth.encryptedRefreshToken,
  });
}

/// *** PRIVATE HELPERS ***
// makes a request to the spotify api, saves the response to dynamo, and returns
// the response (with the refresh_token redacted)
const makeSpotifyAuthRequest = async (
  {userId, paramString, existingEncrypedRefreshToken}: 
  {userId: string, paramString: string, existingEncrypedRefreshToken?: string}
): Promise<SpotifyAPIResponse> => {

  const spotifyClientSecret = await getSecretString("spotifyClientSecret");

  const credsB64 = btoa(
    `${SPOTIFY_CLIENT_ID}:${spotifyClientSecret}`
  );

  let spotifyResponseData

  try {
    spotifyResponseData = (await axios.post(
      "https://accounts.spotify.com/api/token",
      paramString,
      {
        headers: {
          "Authorization": `Basic ${credsB64}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )).data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {

    if (typeof error === "object" && "response" in error) {
      console.log(JSON.stringify(error.response.data));
      return {
        status: error.response.status,
        data: {
          error: error.response.data.error,
          error_description: error.response.data.error_description,
        }
      }
    } else {
      return {
        status: 500,
        data: {
          error: "unknown",
          error_description: error.message
        }
      };
    }
  }

  console.log(`received data from spotify for user ${userId}`);

  // TODO: figure out what to do if the user revoked access
  const invalidGrant = false; //spotifyResponse.data.error === "invalid_grant";

  if (spotifyResponseData.refresh_token == null && existingEncrypedRefreshToken == null) {
    throw Error(`missing spotify refresh token for user ${userId}`);
  }

  // according to the spotify spec, we will only get a new refresh token back
  // on some refreshes, so otherwise we will retain the existing one
  const encryptedRefreshToken = spotifyResponseData.refresh_token != null ?
    await encrypt(spotifyResponseData.refresh_token) : existingEncrypedRefreshToken

  const db = await getFirestoreDb();
  await db.collection("users").doc(userId).set({
    userId,
    spotifyAuth: invalidGrant ? null : {
      accessToken: spotifyResponseData.access_token,
      expirationTime: new Date().getTime() + spotifyResponseData.expires_in * 1000,
      encryptedRefreshToken,
      scope: spotifyResponseData.scope
    },
  }, {
    merge: true,
  });

  // we will always depend on the refresh token as stored in dynamo, so the client
  // does not need it
  if (spotifyResponseData.refresh_token != null) {
    spotifyResponseData.refresh_token = "[REDACTED]";
  }

  return {
    data: spotifyResponseData,
    status: 200,
  };
};
