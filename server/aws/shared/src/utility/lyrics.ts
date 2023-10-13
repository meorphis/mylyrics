// cleans cruft out of lyrics scraped from genius and normalizes them (turns whitespace and quotes
// into standard forms)
export const normalizeSongLyrics = (songLyrics: string) => {
  return normalizeText(cleanSongLyrics(songLyrics));
}

// normalizes passage lyrics as returned by our LLM analysis
export const normalizePassageLyrics = (
  {normalizedSongLyrics, passageLyrics}: {normalizedSongLyrics: string, passageLyrics: string}
) => {
  const normalizedPassageLyrics = normalizeText(passageLyrics);

  if (normalizedSongLyrics.includes(normalizedPassageLyrics)) {
    normalizedPassageLyrics;
  }

  // sometimes, the LLM will use single quotes in cases where the original song lyrics use double
  // quotes; here, we try to figure out if this is the case and turn them back into double quotes
  const renormalizedPassageLyrics = normalizeSingleToDoubleQuotes(
    {songLyrics: normalizedSongLyrics, passageLyrics: normalizedPassageLyrics});

  if (normalizedSongLyrics.includes(renormalizedPassageLyrics)) {
    return renormalizedPassageLyrics
  }

  return null;
}
  
// takes as input a raw lyrics string as returned from genius and returns a cleaned version
// with a few modifications (see inline comments)
const cleanSongLyrics = (lyrics: string) => {
  // remove items in brackets
  let cleanedLyrics = lyrics.replace(/\[.*?\]\n/g, "\n");
  
  // replace three or more line breaks with two
  cleanedLyrics = cleanedLyrics.replace(/\n{2,}/g, "\n");
  
  // remove line breaks at the beginning of the lyrics
  if (cleanedLyrics.startsWith("\n")) {
    cleanedLyrics = cleanedLyrics.slice(1);
  }
  
  return cleanedLyrics;
};
  
const normalizeText = (text: string) => {
  // normalize whitespace to single space
  text = text.replace(/[^\S\n]+/g, " ");
  
  // normalize different types of single quotes to '
  text = text.replace(/‘|’|‛|‚/g, "'");
  
  // normalize different types of double quotes to "
  text = text.replace(/“|”|„|‟/g, "\"");
  
  return text;
}
  
const normalizeSingleToDoubleQuotes = (
  {songLyrics, passageLyrics}: {songLyrics: string, passageLyrics: string}
) => {
  let normalizedPassageLyrics = passageLyrics;
  
  for (let i = 0; i < normalizedPassageLyrics.length; i++) {
    if (normalizedPassageLyrics[i] === "'") {
      const [start, end] = getWordBoundaries({text: normalizedPassageLyrics, index: i});
      const precedingWord = normalizedPassageLyrics.substring(start, i);
      const followingWord = normalizedPassageLyrics.substring(i + 1, end + 1);
  
      let withDoubleQuote;
  
      // handle special cases where the quote is at the beginning or end of the passage
      if (precedingWord === "" && followingWord === "") {
        continue;  // skip this quote as it has no surrounding context
      } else if (precedingWord === "") {
        withDoubleQuote = "\"" + followingWord;
      } else if (followingWord === "") {
        withDoubleQuote = precedingWord + "\"";
      } else {
        withDoubleQuote = precedingWord + "\"" + followingWord;
      }
  
      // check if this pattern exists in the original song
      if (songLyrics.includes(withDoubleQuote)) {
        // replace single quote with double quote
        normalizedPassageLyrics = (
          normalizedPassageLyrics.substring(0, i) + "\"" + normalizedPassageLyrics.substring(i + 1)
        );
      }
    }
  }
  
  return normalizedPassageLyrics;
}
  
  
const getWordBoundaries = ({text, index}: {text: string, index: number}) => {
  let start = index;
  let end = index;
  
  // find the start of the word
  while (start > 0 && /\w/.test(text[start - 1])) {
    start--;
  }
  
  // find the end of the word
  while (end < text.length && /\w/.test(text[end + 1])) {
    end++;
  }
  
  return [start, end];
}