import axios from "axios";
import {AttributeValue, DynamoDBClient, UpdateItemCommand} from "@aws-sdk/client-dynamodb";
import { getSecretString } from "../../utility/clients";

// *** CONSTANTS ***
// public ID, ok to leave in code
export const SPOTIFY_CLIENT_ID = "74da9b8462df4dc2b5b6f3a5fc5e622c"

// *** PUBLIC INTERFACE ***

// takes a settings object for a user and returns a spotify access token
// that will work with the api
//
// notes:
// - if the access token that is stored in the user's settings is expired
//      or about to expire, this function will invoke the spotify api to get
//      a new one and update the user's settings
// - otherwise, it will return the existing access token
// - if no access token is stored in the user's settings, this function
//      will return null
export const getFreshSpotifyToken = async (userObj: Record<string, AttributeValue>) => {
  if (process.env.USER_TABLE_NAME == null) {
    throw Error("USER_TABLE_NAME is not defined in the environment");
  }

  const existingSpotifyAuth = getExistingSpotifyAuth(userObj);
  if (existingSpotifyAuth == null) {
    return null;
  }

  const {existingAccessToken, existingExpirationTime, existingRefreshToken} = existingSpotifyAuth;

  // the token will still be valid more than fifteen seconds from now, which
  // is good enough for our purposes
  if (existingExpirationTime as number > Date.now() + 15 * 1000) {
    return existingAccessToken;
  }

  const spotifyClientSecret = await getSecretString("spotifyClientSecret");

  const credsB64 = btoa(
    `${SPOTIFY_CLIENT_ID}:${spotifyClientSecret}`
  );

  const spotifyResponse = await axios.post(
    "https://accounts.spotify.com/api/token",
    `grant_type=refresh_token&refresh_token=${existingRefreshToken}`,
    {
      headers: {
        "Authorization": `Basic ${credsB64}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  console.log(`received data from spotify for user ${userObj.userId.S}`);

  const {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    expires_in: newExpiresIn,
    error,
  } = spotifyResponse.data;

  const db = new DynamoDBClient({});

  await db.send(new UpdateItemCommand(
    {
      TableName: process.env.USER_TABLE_NAME,
      Key: {
        userId: userObj.userId,
      },
      UpdateExpression: "set spotifyAuth = :spotifyAuth",
      ConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":spotifyAuth": error === "invalid_grant" ? {"NULL": true} : {
          "M": {
            accessToken: {"S": newAccessToken},
            expirationTime: {"N": (new Date().getTime() + newExpiresIn * 1000).toString()},
            refreshToken: {"S": newRefreshToken || existingRefreshToken},
          },
        },
        ":userId": userObj.userId,
      }
    }
  ));

  return newAccessToken;
};

// *** PRIVATE HELPERS ***
const getExistingSpotifyAuth = (userObj: Record<string, AttributeValue>) => {
  const existingSpotifyAuth = userObj.spotifyAuth;

  // this user hasn't authenticated with spotify
  if (existingSpotifyAuth == null) {
    return null;
  }

  if (existingSpotifyAuth.M?.accessToken?.S == null
    || existingSpotifyAuth.M?.expirationTime?.N == null
    || existingSpotifyAuth.M?.refreshToken?.S == null
  ) {
    throw Error(`invalid spotify auth
        object: ${JSON.stringify(existingSpotifyAuth)}
        user: ${userObj.userId.S}
    `);
  }

  return {
    existingAccessToken: existingSpotifyAuth.M.accessToken.S,
    existingExpirationTime: parseInt(existingSpotifyAuth.M.expirationTime.N),
    existingRefreshToken: existingSpotifyAuth.M.refreshToken.S,
  }
}
