import axios from "axios";
import {load as cheerioLoad} from "cheerio";
import { Song } from "../utility/types";
import { stringSimilarity } from "string-similarity-js";

// *** CONSTANTS ***
// minimum similarity (Sørensen–Dice coefficient) between the spotify song name and the genius song
// name to consider them the same song
const MIN_SONG_SIMILARITY = 0.1;

// same as above but for artist names
const MIN_ARTIST_SIMILARITY = 0.1;

// the cutoff for the number of words in a song's lyrics before we truncate it
const MAX_LYRICS_WORDS = 1000;

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
    const songHitsSection = searchResponse.data.response.sections.find(
      (s: {type: string}) => s.type == "song"
    );

    if (songHitsSection == null || songHitsSection.hits.length == 0) {
      return null;
    }

    const geniusSongName = songHitsSection.hits[0].result.title;
    const geniusArtistName = songHitsSection.hits[0].result.primary_artist.name;

    const geniusSongNameSimilarity = stringSimilarity(songName, geniusSongName);
    const geniusArtistNameSimilarity = stringSimilarity(artistName, geniusArtistName);

    console.log(`genius song similarity: ${JSON.stringify(
      {
        songName,
        geniusSongName,
        geniusSongNameSimilarity,
        artistName,
        geniusArtistName,
        geniusArtistNameSimilarity,
      }
    )}`);

    // if the song name or artist name is too different, we probably got the wrong song
    // we might get some false positives here, but we prefer that vs. indexing the wrong song
    if (
      geniusSongNameSimilarity < MIN_SONG_SIMILARITY ||
      geniusArtistNameSimilarity < MIN_ARTIST_SIMILARITY
    ) {
      return null;
    }

    return songHitsSection.hits[0].result.url;
  } catch (e) {
    throw Error(`could not parse genius response ${JSON.stringify(searchResponse.data)}`);
  }
}

const getLyricsFromUrl = async (url: string) => {
  const lyricsResponse = await axios.get(url);
  const lyricsHTML = lyricsResponse.data;

  try {
    const $ = cheerioLoad(lyricsHTML);

    const lyricsContainer = $("[data-lyrics-container=\"true\"]");

    // replace <br> with newline
    $("br", lyricsContainer).replaceWith("\n");

    // replace the elements with their text contents
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $("a", lyricsContainer).replaceWith(((_i: any, el: any) => $(el).text()) as any);

    // remove all child elements, leaving only top-level text content
    lyricsContainer.children().remove();

    const lyrics = lyricsContainer.text();

    if (lyrics.length == 0) {
      // it's probably an instrumental
      return null;
    }

    // limit the number of words in the lyrics to avoid unbounded openai costs
    return lyrics.split(" ").slice(0, MAX_LYRICS_WORDS).join(" ");

  } catch (e) {
    throw Error(`could not parse genius response ${lyricsHTML}`);
  }
}
