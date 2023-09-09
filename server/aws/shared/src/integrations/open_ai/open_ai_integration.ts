import {
  GET_PROPHECY_ASSISTANT_EXAMPLE_MESSAGE,
  GET_PROPHECY_SYSTEM_MESSAGE,
  GET_PROPHECY_USER_EXAMPLE_MESSAGE,
  LABEL_PASSAGES_ASSISTANT_EXAMPLE_MESSAGE,
  LABEL_PASSAGES_SYSTEM_MESSAGE,
  LABEL_PASSAGES_USER_EXAMPLE_MESSAGE
} from "./open_ai_prompt";
import { 
  LabeledPassage, LabelingMetadata, Recommendation, VectorizedAndLabeledPassage
} from "../../utility/types";
import { getSecretString } from "../aws";
import { Configuration, OpenAIApi } from "openai";
import { cachedFunction } from "../../utility/cache";

// *** CONSTANTS ***
const MODEL = "gpt-3.5-turbo";

const OPEN_AI_PARAMS = {
  model: MODEL,
  temperature: 0,
  top_p: 1.0,
}

// *** PUBLIC INTERFACE ***
// takes as input a string containing song lyrics delineated by newline characters
// returns a JSON-serialized object with:
// - sentiments: an array of overall sentiments
// - passages: an array of passage objects each of which has a lyrics string
//    (again delineated by newline characters) and an array of sentiments
// we should expect errors here occasionally in cases where the model does not
// produce valid JSON
export const labelPassages = async (
  {lyrics} : {lyrics: string}
): Promise<{sentiments: string[], passages: LabeledPassage[], metadata: LabelingMetadata}> => {
  const openai = await getOpenAIClient();

  const completionObject = await openai.createChatCompletion({
    messages: [
      {role: "system", content: LABEL_PASSAGES_SYSTEM_MESSAGE},
      {role: "user", content: LABEL_PASSAGES_USER_EXAMPLE_MESSAGE},
      {role: "assistant", content: LABEL_PASSAGES_ASSISTANT_EXAMPLE_MESSAGE},
      {role: "user", content: lyrics},
    ],
    ...OPEN_AI_PARAMS,
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rawContent = completionObject.data.choices[0].message!.content!;
  let content;
  try {
    content = JSON.parse(rawContent);
  } catch (e) {
    throw Error(`could not parse openai response as json
      lyrics: ${lyrics}
      response: ${rawContent}
    `);
  }

  // we refer to sentiments as "floopters" in our prompt in order to steer the LLM away from
  // its preconceived notions about what a sentiment is and instead select from our curated list
  if ("passages" in content && "floopters" in content) {
    return {
      sentiments: content.floopters,
      passages: addMetadataToPassages(content.passages),
      metadata: {
        labeledBy: "gpt-3.5-turbo",
      }
    }
  } else {
    throw Error(`openai response contains incorrect fields
      lyrics: ${lyrics}
      response: ${JSON.stringify(content)}
    `);
  }
};

// takes as input a list of labeled passages and returns a list of the same
// passages with an additional field containing a vector representation of the
// lyrics
export const vectorizePassages = async (
  {labeledPassages} : {labeledPassages: LabeledPassage[]}
): Promise<VectorizedAndLabeledPassage[]> => {
  const openai = await getOpenAIClient();

  const vectorResponses = await Promise.all(labeledPassages.map((passage) => {
    return openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: passage.lyrics,
    });
  }));

  return labeledPassages.map((passage, idx) => ({
    ...passage,
    lyricsVector: vectorResponses[idx].data.data[0].embedding
  }));
};

// takes in a term and returns the vector
export const vectorizeSearchTerm = async (
  {term}: {term: string}
): Promise<number[]> => {
  const openai = await getOpenAIClient();

  const vectorResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: term,
  });

  return vectorResponse.data.data[0].embedding;
}

// takes as input a list of passage recommendations and returns a "prophecy"
// string from the GPT API
export const computeProphecy = async (
  {passages} : {passages: Recommendation[]}) => {
  const openai = await getOpenAIClient();

  const completionObject = await openai.createChatCompletion({
    messages: [
      {role: "system", content: GET_PROPHECY_SYSTEM_MESSAGE},
      {role: "user", content: GET_PROPHECY_USER_EXAMPLE_MESSAGE},
      {role: "assistant", content: GET_PROPHECY_ASSISTANT_EXAMPLE_MESSAGE},
      {role: "user", content: passagesToText(passages)},
    ],
    ...OPEN_AI_PARAMS,
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return completionObject.data.choices[0].message!.content!;  
}

// *** PRIVATE HELPERS ***
// client for the OpenAI API
const _getOpenAIClient = async () => {
  const openaiApiKey = await getSecretString("openaiApiKey");
  const configuration = new Configuration({
    apiKey: openaiApiKey,
  });
  return new OpenAIApi(configuration);
}
const getOpenAIClient = cachedFunction(_getOpenAIClient);

const addMetadataToPassages = (passages: {
  lyrics: string,
  sentiments: string[],
}[]): LabeledPassage[] => {
  return passages.map((passage) => {
    if (!("lyrics" in passage) || !("sentiments" in passage)) {
      throw Error(`passage is missing fields
        passage: ${JSON.stringify(passage)}
      `);
    }

    const lines = passage.lyrics.split("\n");
    const numLines = lines.length;
    const numCharsPerLine = lines.map((line) => line.length);
    const numEffectiveLines = numCharsPerLine.map(
      (numChars) => Math.ceil(numChars / 35)
    ).reduce((a, b) => a + b, 0);

    return {
      ...passage,
      metadata: {
        numLines,
        numCharsPerLine,
        numEffectiveLines,
      }
    }});
}

const passagesToText = (passages: Recommendation[]): string => {
  return passages.map(passageToText).join("\n\n");
}

const passageToText = (passage: Recommendation): string => {
  return `Artist: ${passage.song.artists[0].name}
Lyrics: ${passage.song.lyrics}
Sentiments: ${passage.tags.map((tag) => tag.sentiment).join(", ")}`;
}