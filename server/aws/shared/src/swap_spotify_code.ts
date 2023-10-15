import { swapCodeForSpotifyResponse } from "./integrations/spotify/spotify_auth";

// *** PUBLIC INTERFACE ***
// a thin wrapper over swapCodeForSpotifyResponse that takes a userId string and a code
// that was received from the spotify api and returns a spotify api response
export const swapSpotifyCode = async (
  {userId, code}: {userId: string, code: string}
) => {
  const spotifyResponse = await swapCodeForSpotifyResponse({userId, code});
  if (spotifyResponse == null) {
    console.log(`failed to swap code for spotify response for user ${userId}`);
    throw new Error(`failed to swap code for spotify response for user ${userId}`);
  }

  return spotifyResponse;
}