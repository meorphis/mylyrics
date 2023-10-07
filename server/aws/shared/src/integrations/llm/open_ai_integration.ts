import {
  GET_ARTIST_EMOJI_EXAMPLE_COMPLETIONS,
  GET_ARTIST_EMOJI_SYSTEM_MESSAGE,
  GET_PROPHECY_ASSISTANT_EXAMPLE_MESSAGE,
  GET_PROPHECY_SYSTEM_MESSAGE,
  GET_PROPHECY_USER_EXAMPLE_MESSAGE,
  LABEL_PASSAGES_ASSISTANT_EXAMPLE_MESSAGE,
  LABEL_PASSAGES_SYSTEM_MESSAGE,
  LABEL_PASSAGES_USER_EXAMPLE_MESSAGE
} from "./prompt";
import { 
  LabeledPassage, Recommendation, VectorizedAndLabeledPassage
} from "../../utility/types";
import { getSecretString } from "../aws";
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from "openai";
import { cachedFunction } from "../../utility/cache";
import { LabelPassagesOutput, labelPassages } from "./label_passages";

// *** CONSTANTS ***
const MODEL = "gpt-3.5-turbo";

const DEFAULT_OPEN_AI_PARAMS = {
  model: MODEL,
  temperature: 0,
  top_p: 1.0,
}

// *** PUBLIC INTERFACE ***
// invokes the OpenAI API to label passages as described in the docstring for
// labelPassages
export const labelPassagesOpenAI = async ({lyrics}: {lyrics: string}): Promise<{
  status: "success",
  content: LabelPassagesOutput
} | {
  status: "error",
}> => {
  return await labelPassages({
    lyrics,
    invokeModel: async ({lyrics}: {lyrics: string}) => {
      const openai = await getOpenAIClient();

      const completionObject = await openai.createChatCompletion({
        messages: [
          {role: "system", content: LABEL_PASSAGES_SYSTEM_MESSAGE},
          {role: "user", content: LABEL_PASSAGES_USER_EXAMPLE_MESSAGE},
          {role: "assistant", content: LABEL_PASSAGES_ASSISTANT_EXAMPLE_MESSAGE},
          {role: "user", content: lyrics},
        ],
        ...DEFAULT_OPEN_AI_PARAMS,
      });
  
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return completionObject.data.choices[0].message!.content!;
    },
    modelName: "gpt-3.5-turbo",
  })
}

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
    ...DEFAULT_OPEN_AI_PARAMS,
    temperature: 1.0,
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return completionObject.data.choices[0].message!.content!;  
}

// gets an emoji (or sometimes a string of multiple emojis) that most closely represents an artist
export const getArtistEmoji = async (
  {artistName}: {artistName: string}
) => {
  const openai = await getOpenAIClient();

  const completionObject = await openai.createChatCompletion({
    messages: [
      {role: "system", content: GET_ARTIST_EMOJI_SYSTEM_MESSAGE},
      ...GET_ARTIST_EMOJI_EXAMPLE_COMPLETIONS.map(entry => [
        {
          role: "user" as ChatCompletionRequestMessageRoleEnum, content: entry[0]
        },
        {
          role: "assistant" as ChatCompletionRequestMessageRoleEnum, content: entry[1]
        }
      ]).flat(),
      {role: "user", content: artistName},
    ],
    ...DEFAULT_OPEN_AI_PARAMS,
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

const passagesToText = (passages: Recommendation[]): string => {
  return passages.map(passageToText).join("\n\n");
}

const passageToText = (passage: Recommendation): string => {
  const sentiments = passage.bundleInfos
    .filter(bi => bi.type === "sentiment")
    // @ts-ignore
    .map((bk) => bk.sentiment).join(", ")
  const sentimentsText = sentiments.length > 0 ? `Sentiments: ${sentiments}` : "";

  return `Artist: ${passage.song.artists[0].name}
Lyrics: ${passage.song.lyrics}
${sentimentsText}`;
}