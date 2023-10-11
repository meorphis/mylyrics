import { LabeledPassage } from "./types";

export const NUMBER_OF_RECOMMENDATIONS_FOR_MAIN_SENTIMENT = 10;
export const NUMBER_OF_RECOMMENDATIONS_FOR_SECONDARY_SENTIMENTS = 5;

// adds information about a passage's size to the passage object
export const addMetadataToPassage = (passage: {
    lyrics: string,
    sentiments: string[],
    }): LabeledPassage => {
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
  }};
        