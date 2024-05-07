import { addMetadataToPassage } from "../../utility/recommendations";
import { LabeledPassage, LabelingMetadata } from "../../utility/types";

export type LabelPassagesOutput = {
  sentiments: string[],
  passages: LabeledPassage[],
  metadata: LabelingMetadata
}

type LabelPassagesRawModelOutput = {
  floopters: string[],
  passages: {
    lyrics: string[],
    floopters: string[]
  }[],
  metadata: LabelingMetadata
}

// the cutoff for the number of words in a song's lyrics before we truncate it
// presumably if a song exceeds this limit, we'll still be able to get some good
// passages and avoid hitting the LLM's max token limit
const MAX_LYRICS_WORDS = 800;

// *** PUBLIC INTERFACE ***
// takes as input a string containing song lyrics delineated by newline characters
// returns a JSON-serialized object with:
// - sentiments: an array of overall sentiments
// - passages: an array of passage objects each of which has a lyrics string
//    (again delineated by newline characters) and an array of sentiments
// can be run with either the gpt-4o-mini or the anthropic.claude-instant-v1 model
export const labelPassages= async (
  {lyrics, invokeModel, modelName}:
    {
        lyrics: string,
        invokeModel: ({lyrics} : {lyrics: string}) => Promise<string>,
        modelName: "anthropic.claude-3-haiku-20240307-v1:0" | "gpt-4o-mini"
    }
): Promise<{
    status: "success",
    content: LabelPassagesOutput
  } | {
    status: "error",
  }>  => {
  let rawContent;

  try {
    rawContent = await invokeModel({
      lyrics: lyrics.split(" ").length > MAX_LYRICS_WORDS ? truncateLyrics({lyrics}) : lyrics,
    });
  } catch (e) {
    console.log(`error invoking model: ${e}`);
    return {status: "error"};
  }

  let content: LabelPassagesRawModelOutput;
  try {
    content = JSON.parse(rawContent);
  } catch (e) {
    console.log(`error parsing ${modelName} response: ${rawContent}`);
    return {status: "error"};
  }

  // we refer to sentiments as "floopters" in our prompt in order to steer the LLM away from
  // its preconceived notions about what a sentiment is and instead select from our curated list
  if ("passages" in content && "floopters" in content) {
    try {
      return {
        status: "success",
        content: {
          sentiments: content.floopters,
          passages: content.passages.map(p => ({
            lyrics: p.lyrics.join("\n"),
            sentiments: p.floopters,
          })).map(addMetadataToPassage),
          metadata: {
            labeledBy: modelName,
          }
        }
      } 
    } catch (e) {
      console.log(`error parsing ${modelName} response: ${rawContent}`);
      return {status: "error"};
    }
  } else {
    console.log(`error parsing openai response: ${rawContent}`);
    return {status: "error"};
  }
}

// get the longest possible prefix from the lyrics such that we truncate
// at a line break
const truncateLyrics = ({lyrics}: {lyrics: string}): string => {
  const lyricsLines = lyrics.split("\n");
  let truncatedLyrics = "";
  let nextTruncatedLyrics = "";
  let i = 0;
  // ensure number of words in truncatedLyrics is less than MAX_LYRICS_WORDS
  while (nextTruncatedLyrics.split(" ").length < MAX_LYRICS_WORDS) {
    truncatedLyrics = nextTruncatedLyrics;

    if (i === lyricsLines.length) {
      break
    }

    nextTruncatedLyrics += lyricsLines[i] + "\n";
    i++;
  }

  // remove trailing newline
  return truncatedLyrics.slice(0, -1);
}
