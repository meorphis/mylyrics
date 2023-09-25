// takes a string of song lyrics and string of passage lyrics within that song and returns
// an array representing the song lyrics split into lines - each "line" is an object containing:
// - lineText: the text of the line
// - passageStart: the index where the passage starts in the line, or null if the line does not
//    begin the passage
// - passageEnd: the index where the passage ends in the line, or null if the line does not
//    end the passage
// - passageLine: the line number of the passage, or null if the line is not part of the passage
export const splitLyricsWithPassages = ({
  songLyrics,
  passageLyrics,
}: {
  songLyrics: string;
  passageLyrics: string;
}) => {
  const highlightStart = songLyrics.indexOf(passageLyrics);
  const highlightEnd = highlightStart + passageLyrics.length;

  let passageStarted = false;
  let passageEnded = false;
  let passageLine: number | null = null;

  return splitWithIndexes(songLyrics, '\n').map(({value, index}) => {
    const includesPassage = index >= highlightStart && index <= highlightEnd;

    if (passageStarted && !passageEnded && passageLine != null) {
      passageLine += 1;
    } else {
      passageLine = null;
    }

    let passageStart = null;
    if (includesPassage && !passageStarted) {
      passageStart = index - highlightStart;
      passageStarted = true;
      passageLine = 0;
    }

    let passageEnd = null;
    if (highlightEnd >= index && highlightEnd <= index + value.length) {
      passageEnd = highlightEnd - index;
      passageEnded = true;
    }

    return {
      lineText: value,
      passageStart,
      passageEnd,
      passageLine,
    };
  });
};

// takes as input a raw lyrics string as returned from the database and returns a cleaned version
// with a few modifications (see inline comments)
export const cleanLyrics = (lyrics: string) => {
  // remove items in brackets
  let cleanedLyrics = lyrics.replace(/\[.*?\]\n/g, '\n');

  // replace three or more line breaks with two
  cleanedLyrics = cleanedLyrics.replace(/\n{2,}/g, '\n');

  // remove line breaks at the beginning of the lyrics
  if (cleanedLyrics.startsWith('\n')) {
    cleanedLyrics = cleanedLyrics.slice(1);
  }

  return cleanedLyrics;
};

const splitWithIndexes = (str: string, delimiter: string) => {
  const parts = str.split(delimiter);
  let currentIndex = 0;

  const result = parts.map(part => {
    const obj = {
      value: part,
      index: currentIndex,
    };

    currentIndex += part.length + delimiter.length;
    return obj;
  });

  return result;
};
