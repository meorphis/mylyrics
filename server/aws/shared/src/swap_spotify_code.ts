import { swapCodeForSpotifyResponse } from "./integrations/spotify/spotify_auth";

export const swapSpotifyCode = async (
  {userId, code}: {userId: string, code: string}
) => {
  const spotifyResponse = await swapCodeForSpotifyResponse({userId, code});
  if (spotifyResponse == null) {
    throw new Error(`failed to swap code for spotify response for user ${userId}`);
  }

  return spotifyResponse;
}