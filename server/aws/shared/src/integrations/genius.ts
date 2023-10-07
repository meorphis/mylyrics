import axios from "axios";
import {load as cheerioLoad} from "cheerio";
import { Song } from "../utility/types";
import { stringSimilarity } from "string-similarity-js";

// *** TYPES ***
type GetLyricsResponse = {
  outcome: "success",
  lyrics: string
} | {
  outcome: "failure",
  reason: string,
}

type GetLyricsUrlResponse = {
  outcome: "success",
  url: string,
} | {
  outcome: "failure",
  reason: string,
}

// *** CONSTANTS ***
// minimum similarity (Sørensen–Dice coefficient) between the spotify song name and the genius song
// name to consider them the same song
const MIN_SONG_SIMILARITY = 0.1;

// same as above but for artist names
const MIN_ARTIST_SIMILARITY = 0.1;

// maximum number of words to retain from a song's lyrics
// we have a shorter limit when labeling lyrics with LLMs (see label_passages.ts), but we use a more
// liberal limit here, since we're ok with storing longer lyrics and showing them in their entirety
// in the UI (within reason)
const MAX_LYRICS_WORDS = 5000;

// *** PUBLIC INTERFACE ***
// takes as input an artist name and a song name and returns the lyrics
// scraped from genius.com
// notes:
// - returns null if the genius response is formatted as expected but does not
//    contain a result for the song
// - throws an error if the genius response is not formatted as expected
export const getLyrics = async ({song} : {song: Song}): Promise<GetLyricsResponse> => {
  const lyricsUrl = await getLyricsUrl({song});
  if (lyricsUrl.outcome === "failure")  {
    return {
      outcome: "failure",
      reason: lyricsUrl.reason,
    };
  }
  
  return await getLyricsFromUrl(lyricsUrl.url);
};

// *** PRIVATE HELPERS ***
const getLyricsUrl = async ({song} : {song: Song}) : Promise<GetLyricsUrlResponse> => {
  const {primaryArtist, name: songName} = song;
  const sanitizedSongNames = sanitizeSongName({songName});

  let failureReason = "lyrics_url_not_found_for_unknown_reason";

  console.log(sanitizedSongNames);

  for (const sanitizedSongName of sanitizedSongNames) {
    const query = encodeURIComponent(primaryArtist.name + " " + sanitizedSongName);
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
        failureReason = "no_genius_hits";
        continue;
      }

      const geniusSongName = songHitsSection.hits[0].result.title;
      const geniusArtistName = songHitsSection.hits[0].result.primary_artist.name;

      const geniusSongNameSimilarity = stringSimilarity(sanitizedSongName, geniusSongName);
      const geniusArtistNameSimilarity = stringSimilarity(primaryArtist.name, geniusArtistName);

      console.log(`genius song similarity: ${JSON.stringify(
        {
          sanitizedSongName,
          geniusSongName,
          geniusSongNameSimilarity,
          artistName: primaryArtist.name,
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
        failureReason = "song_name_or_artist_name_too_different";
        continue;
      }

      return {
        outcome: "success",
        url: songHitsSection.hits[0].result.url,
      };
    } catch (e) {
      console.warn(`could not parse genius response ${JSON.stringify(searchResponse.data)}`);
      failureReason = "genius_response_not_formatted_as_expected";
      continue;
    }
  }

  return {
    outcome: "failure",
    reason: failureReason,
  };
}

const getLyricsFromUrl = async (url: string): Promise<GetLyricsResponse> => {
  const lyricsResponse = await axios.get(url);
  const lyricsHTML = lyricsResponse.data;

  try {
    const $ = cheerioLoad(lyricsHTML);

    const lyricsContainer = $("[data-lyrics-container=\"true\"]");

    // replace <br> with newline
    $("br", lyricsContainer).replaceWith("\n");

    // replace decorative elements with their text contents
    $(
      "a, b, i, em, strong, small, sub, sup, mark, ins, del, u",
      lyricsContainer
    // @ts-ignore
    ).replaceWith((_i: unknown, el: unknown) => $(el).text());

    // remove all child elements, leaving only top-level text content
    lyricsContainer.children().remove();

    const lyrics = lyricsContainer.text();

    if (lyrics.length == 0) {
      // it's probably an instrumental
      return {
        outcome: "failure",
        reason: "likely_instrumental",
      };
    }

    // limit the number of words in the lyrics to avoid unbounded openai costs
    return {
      outcome: "success",
      lyrics: lyrics.split(" ").slice(0, MAX_LYRICS_WORDS).join(" "),
    };

  } catch (e) {
    throw Error(`could not parse genius response ${lyricsHTML}`);
  }
}

// devised by looking at some song names on spotify; if there are multiple potential names, we may
// return more than one, in the order that we should check them
const sanitizeSongName = ({songName}: {songName: string}): string[] => {
  // remove (feat *)
  songName = songName.replace(/\(feat.*\)/, "");
  
  // remove (Remastered)
  songName = songName.replace(/\(Remastered\)/, "");
  
  // remove Mono)
  songName = songName.replace(/\(Mono\)/, "");

  let songNames = [songName];
  
  // if there's a dash, the text after it may be extraneous, e.g.
  // The Beach Boys' "Here Today - Mono" - extraneous
  // Janet Jackson's "Interlude - Fasten Your Seatbelts" - not extraneous
  const dashIndex = songName.indexOf(" - ");
  if (dashIndex != -1) {
    songNames.push(songName.substring(0, dashIndex));
  }

  // we might also have a case where there's extraneous text in parentheses at the end of the song,
  // e.g. Mystery of Love (From the Original Motion Picture “Call Me by Your Name”)
  const withStrippedParentheses = stripTrailingParentheses(songName);
  if (withStrippedParentheses) {
    songNames.push(withStrippedParentheses);
  }
  
  // remove trailing whitespace
  songNames = songNames.map(s => s.trim());
  
  return songNames
}

const stripTrailingParentheses = (str: string) => {
  const match = str.match(/^(.*)\s+\([^)]+\)$/);
  if (match) {
    return match[1];
  }
  return null;
}