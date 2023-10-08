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
  // inclusive range
  const highlightStart = songLyrics.indexOf(passageLyrics);
  const highlightEnd = highlightStart + passageLyrics.length - 1;

  let passageLine: number | null = null;

  return splitWithIndexes(songLyrics, '\n').map(
    ({value, lineStart, nextLineStart}) => {
      const lineEnd = nextLineStart - 1;
      // first line of passage: the highlight starts somewhere on this line
      const isPassageFirstLine =
        highlightStart >= lineStart && highlightStart <= lineEnd;

      // middle line of passage: the highlight is fully contained within this line
      const isPassageMiddeLine =
        lineStart > highlightStart && lineEnd < highlightEnd;

      // last line of passage: the highlight ends somewhere on this line
      const isPassageLastLine =
        highlightEnd >= lineStart && highlightEnd <= lineEnd;

      const lineIncludesPassage =
        isPassageFirstLine || isPassageMiddeLine || isPassageLastLine;

      if (!lineIncludesPassage) {
        return {
          lineText: value,
          passageInfo: null,
        };
      }

      passageLine = passageLine == null ? 0 : passageLine + 1;
      const passageStart = isPassageFirstLine ? highlightStart - lineStart : 0;
      const passageEnd = isPassageLastLine
        ? highlightEnd - lineStart + 1
        : value.length;

      return {
        lineText: value,
        passageInfo: {
          passageStart,
          passageEnd,
          passageLine,
        },
      };
    },
  );
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
  let lineStart = 0;
  let nextLineStart: number;

  const result = parts.map(part => {
    nextLineStart = lineStart + part.length + delimiter.length;

    const obj = {
      value: part,
      lineStart,
      nextLineStart,
    };

    lineStart = nextLineStart;

    return obj;
  });

  return result;
};
