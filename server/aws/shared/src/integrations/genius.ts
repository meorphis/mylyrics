import axios from "axios";
import {load as cheerioLoad} from "cheerio";
import { Song } from "../utility/types";

// *** PUBLIC INTERFACE ***
// takes as input an artist name and a song name and returns the lyrics
// scraped from genius.com
// notes:
// - returns null if the genius response is formatted as expected but does not
//    contain a result for the song
// - throws an error if the genius response is not formatted as expected
export const getLyrics = async ({song} : {song: Song}) => {
  const lyricsUrl = await getLyricsUrl({song});
  return lyricsUrl == null ? null : await getLyricsFromUrl(lyricsUrl);
};

// *** PRIVATE HELPERS ***
const getLyricsUrl = async ({song} : {song: Song}) : Promise<string | null> => {
  const {artistName, songName} = song;
  const query = encodeURIComponent(artistName + " " + songName);
  const searchResponse = await axios.get(
    `https://genius.com/api/search/multi?per_page=1&q=${query}`,
    {
      headers: {
        // hard-coded user agent seems to be good enough for now
        // eslint-disable-next-line max-len
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36",
      },
    }
  );

  try {
    const songHits = searchResponse.data.response.sections[0].hits.filter((h: {
      type: string, result: {url: string}
    }) => h.type == "song")

    if (songHits.length == 0) {
      return null;
    }
  
    return songHits[0].result.url;
  } catch (e) {
    throw Error(`could not parse genius response ${JSON.stringify(searchResponse.data)}`);
  }
}

const getLyricsFromUrl = async (url: string) => {
  const lyricsResponse = await axios.get(url);
  const lyrics = lyricsResponse.data;

  try {
    const $ = cheerioLoad(lyrics);

    const lyricsContainer = $("[data-lyrics-container=\"true\"]");

    // Replace <br> with newline
    $("br", lyricsContainer).replaceWith("\n");

    // Replace the elements with their text contents
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $("a", lyricsContainer).replaceWith(((_i: any, el: any) => $(el).text()) as any);

    // Remove all child elements, leaving only top-level text content
    lyricsContainer.children().remove();

    return lyricsContainer.text();
  } catch (e) {
    throw Error(`could not parse genius response ${lyrics}`);
  }
}
