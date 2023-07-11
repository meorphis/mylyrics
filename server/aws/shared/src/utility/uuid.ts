import {v5} from "uuid";
import { Song } from "./types";

export const uuidForSong = ({
  songName, artistName,
}: {songName: string, artistName: string}) => {
  return v5(
    `${artistName}: ${songName}`, "0b6ea510-176f-482f-85f9-2fd70bb30fe1"
  );
};
  
export const uuidForArtist = ({artistName}: {artistName: string}) => {
  return v5(artistName, "eca91d8c-ef5a-4b2f-8ee0-481318e0efc0");
};
  
export const uuidForPassage = (
  {song, lyrics}: {song: Song, lyrics: string}
) => {
  return v5(
    `${song.artistName}: ${song.songName}: ${lyrics}`, "9e2cdd05-4d00-4ccf-a40b-d82305430fcf"
  );
};
