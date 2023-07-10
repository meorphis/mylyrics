import {SYSTEM_MESSAGE} from "./open_ai_prompt";
import { LabeledPassage, VectorizedAndLabeledPassage } from "../../utility/types";
import { getOpenAIClient } from "../../utility/clients";

// *** CONSTANTS ***
const OPEN_AI_PARAMS = {
  model: "gpt-3.5-turbo",
  temperature: 0.5,
  top_p: 0.2,
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
): Promise<{sentiments: string[], passages: LabeledPassage[]}> => {
  const openai = await getOpenAIClient();

  const completionObject = await openai.createChatCompletion({
    messages: [
      {"role": "system", "content": SYSTEM_MESSAGE},
      {role: "user", content: lyrics},
    ],
    ...OPEN_AI_PARAMS,
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return JSON.parse(completionObject.data.choices[0].message!.content!);
  } catch (e) {
    throw Error(`openai response was not valid json
      lyrics: ${lyrics}
      response: ${JSON.stringify(completionObject)}
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
