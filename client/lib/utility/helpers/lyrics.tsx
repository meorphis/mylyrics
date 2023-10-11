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

export const cleanGeneratedPassage = ({songLyrics, passageLyrics}: {songLyrics: string, passageLyrics: string}) => {
  // Normalize original song lyrics and generated passages
  const normalizedSongLyrics = normalizeText(cleanSongLyrics(songLyrics));
  const normalizedPassageLyrics = normalizeText(passageLyrics);

  if (normalizedSongLyrics.includes(normalizedPassageLyrics)) {
    return {
      normalizedSongLyrics,
      normalizedPassageLyrics,
    };
  }

  const renormalizedPassageLyrics = normalizeSingleToDoubleQuotes({songLyrics: normalizedSongLyrics, passageLyrics: normalizedPassageLyrics});

  if (normalizedSongLyrics.includes(renormalizedPassageLyrics)) {
    return {
      normalizedSongLyrics,
      normalizedPassageLyrics: renormalizedPassageLyrics,
    };
  }

  return null;
}

// takes as input a raw lyrics string as returned from the database and returns a cleaned version
// with a few modifications (see inline comments)
const cleanSongLyrics = (lyrics: string) => {
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

const normalizeText = (text: string) => {
  // Normalize whitespace to single space
  text = text.replace(/[^\S\n]+/g, ' ');

  // Normalize different types of single quotes to '
  text = text.replace(/‘|’|‛|‚/g, "'");

  // Normalize different types of double quotes to "
  text = text.replace(/“|”|„|‟/g, '"');

  return text;
}

const normalizeSingleToDoubleQuotes = ({songLyrics, passageLyrics}: {songLyrics: string, passageLyrics: string}) => {
  let normalizedPassageLyrics = passageLyrics;

  // Use a dynamic index because the string length may change as we replace quotes
  for (let i = 0; i < normalizedPassageLyrics.length; i++) {
    if (normalizedPassageLyrics[i] === "'") {
      let [start, end] = getWordBoundaries({text: normalizedPassageLyrics, index: i});
      let precedingWord = normalizedPassageLyrics.substring(start, i);
      let followingWord = normalizedPassageLyrics.substring(i + 1, end + 1);

      let withDoubleQuote;

      // Handle special cases where the quote is at the beginning or end of the passage
      if (precedingWord === "" && followingWord === "") {
        continue;  // Skip this quote as it has no surrounding context
      } else if (precedingWord === "") {
        withDoubleQuote = '"' + followingWord;
      } else if (followingWord === "") {
        withDoubleQuote = precedingWord + '"';
      } else {
        withDoubleQuote = precedingWord + '"' + followingWord;
      }

      // Check if this pattern exists in the original song
      if (songLyrics.includes(withDoubleQuote)) {
        // Replace single quote with double quote
        normalizedPassageLyrics = normalizedPassageLyrics.substring(0, i) + '"' + normalizedPassageLyrics.substring(i + 1);
      }
    }
  }

  return normalizedPassageLyrics;
}


const getWordBoundaries = ({text, index}: {text: string, index: number}) => {
  let start = index;
  let end = index;

  // Find the start of the word
  while (start > 0 && /\w/.test(text[start - 1])) {
    start--;
  }

  // Find the end of the word
  while (end < text.length && /\w/.test(text[end + 1])) {
    end++;
  }

  return [start, end];
}

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
