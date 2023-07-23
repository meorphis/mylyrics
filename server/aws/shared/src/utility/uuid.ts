import {createHash} from "crypto";

// 12 bytes allows us to have >10 trillion ids before we have a 0.1% chance of collision
export const createShortUniqueId = (seed: string) => {
  return createHash("shake256", { outputLength: 12 })
    .update(seed)
    // base64url is 6 bits per character, so 12 bytes = 16 characters
    .digest("base64url");
};

export const uuidForArtist = ({artistName}: {artistName: string}) => {
  return createShortUniqueId(`artist: ${artistName}`);
}

export const uuidForSong = ({songName, artistName}: {songName: string, artistName: string}) => {
  return createShortUniqueId(`song: ${songName} by ${artistName}`);
}

export const uuidForPassage = (
  {lyrics, songName, artistName}: {lyrics: string, songName: string, artistName: string}
) => {
  return createShortUniqueId(`lyrics: ${lyrics} in ${songName} by ${artistName}`);
}
