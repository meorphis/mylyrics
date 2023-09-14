import ThemeType from '../types/theme';
import {colorDistance, ensureColorContrast2, isColorLight} from './color';

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

export const cleanLyrics = (lyrics: string) => {
  // Remove items in brackets
  let cleanedLyrics = lyrics.replace(/\[.*?\]\n/g, '\n');

  // Replace three or more line breaks with two
  cleanedLyrics = cleanedLyrics.replace(/\n{2,}/g, '\n');

  if (cleanedLyrics.startsWith('\n')) {
    cleanedLyrics = cleanedLyrics.slice(1);
  }

  return cleanedLyrics;
};

export const getLyricsColor = ({theme}: {theme: ThemeType}) => {
  // choose the one furthest in distance from the background color
  const colors = [theme.primaryColor, theme.secondaryColor, theme.detailColor];
  return ensureColorContrast2({
    changeable: getFurthestColor({
      subject: theme.backgroundColor,
      options: colors,
    }),
    unchangeable: theme.backgroundColor,
    shouldDarkenFn: ({unchangeable}) => isColorLight(unchangeable),
  });
};

export const getFurthestColor = ({
  subject,
  options,
  ensureContrast,
}: {
  subject: string;
  options: string[];
  ensureContrast?: boolean;
}) => {
  const distances = options.map(option => colorDistance(option, subject));
  const maxDistance = Math.max(...distances);
  const maxIndex = distances.indexOf(maxDistance);
  const proposedColor = options[maxIndex];

  if (!ensureContrast) {
    return proposedColor;
  }

  return ensureColorContrast2({
    changeable: proposedColor,
    unchangeable: subject,
    shouldDarkenFn: ({
      unchangeable,
    }: {
      changeable: string;
      unchangeable: string;
    }) => isColorLight(unchangeable),
  });
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
