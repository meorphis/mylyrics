import ThemeType, {ThemeSelection} from '../../types/theme';
import {AlbumCoverColor} from '../../types/color';
import {colorDistance, isColorLight} from './color';
import convert from 'color-convert';
import {calcAPCA} from 'apca-w3';
import {PassageType} from '../../types/passage';

// converts the colors extracted from an album cover into a theme we can use
// to render the UI
// - uses the first four colors (ordered by area)
// - uses the first one as the primary theme and the other three as alternates
// - for each theme, computes:
//    - a "far background color" which is a slightly darkened or lightened variant of
//      the original
//    - an inverted version of the theme (wherein we swap the background and far background)
//    - text colors: we lighten or darken all four colors until they have a sufficient contrast
//      with the background (APCA value >= 75)
// - since the primary theme color is often the exact background color of the album
//   cover itself we invert that one by default (so that it contrasts nicely with the
//   album cover)
export const getThemeFromAlbumColors = (
  albumCoverColors: AlbumCoverColor[],
) => {
  const sortedColors = albumCoverColors.sort((a, b) => {
    return b.area - a.area;
  });

  const mainBackgroundColor = sortedColors[0];
  const alternativeColors = sortedColors.slice(1, 4);

  const mainBaseTheme = constructBaseTheme({
    backgroundColor: mainBackgroundColor,
    foregroundColors: alternativeColors,
  });

  const alternateBaseThemes = alternativeColors.map(color => {
    let baseTheme = constructBaseTheme({
      backgroundColor: color,
      foregroundColors: sortedColors
        .slice(0, 4)
        .filter(c => c.hex !== color.hex),
      invert: true,
    });

    let invertedBaseTheme = constructBaseTheme({
      backgroundColor: color,
      foregroundColors: sortedColors
        .slice(0, 4)
        .filter(c => c.hex !== color.hex),
      invert: false,
    });

    baseTheme.invertedTheme = invertedBaseTheme as ThemeType;
    return baseTheme;
  });

  const invertedMainBaseTheme = constructBaseTheme({
    backgroundColor: mainBackgroundColor,
    foregroundColors: alternativeColors,
    invert: true,
  });

  mainBaseTheme.invertedTheme = invertedMainBaseTheme as ThemeType;
  mainBaseTheme.alternateThemes = alternateBaseThemes as ThemeType[];
  invertedMainBaseTheme.alternateThemes = alternateBaseThemes as ThemeType[];

  return mainBaseTheme as ThemeType;
};

const constructBaseTheme = ({
  backgroundColor,
  foregroundColors,
  invert = false,
}: {
  backgroundColor: AlbumCoverColor;
  foregroundColors: AlbumCoverColor[];
  invert?: boolean;
}): Omit<ThemeType, 'invertedTheme'> & {invertedTheme?: ThemeType} => {
  const contrastBackgroundColor = getContrastBackgroundColor({
    backgroundColorHex: backgroundColor.hex,
  });

  const mainBackgroundColor = invert
    ? backgroundColor.hex
    : contrastBackgroundColor;

  const farBackgroundColor = invert
    ? contrastBackgroundColor
    : backgroundColor.hex;

  return {
    backgroundColor: mainBackgroundColor,
    farBackgroundColor,
    textColors: getContrastColors({
      backgroundColor: mainBackgroundColor,
      foregroundColors: [
        mainBackgroundColor,
        ...foregroundColors.map(c => c.hex),
      ],
    })
      .filter(
        // remove approximate duplicates
        (color, index, self) =>
          !self.slice(0, index).some(c => colorDistance(c, color) < 15),
      )
      .slice(0, 4),
    alternateThemes: [],
  };
};

// gets the default customization for a given passage
export const getDefaultCustomizationForPassage = (passage: PassageType) => {
  const themeSelection = {
    theme: passage.theme,
    inverted: false,
  };

  return {
    themeSelection,
    textColorSelection: getDefaultTextColorForThemeSelection(themeSelection),
  };
};

// gets the default text color for a given theme selection
export const getDefaultTextColorForThemeSelection = (
  themeSelection: ThemeSelection,
) =>
  themeSelection.inverted
    ? themeSelection.theme.invertedTheme!.textColors[0]
    : themeSelection.theme.textColors[0];

const getContrastBackgroundColor = ({
  backgroundColorHex,
}: {
  backgroundColorHex: string;
}) => {
  const [L, a, b] = convert.hex.lab(backgroundColorHex);

  const shouldDarken =
    L > 50 || (Math.abs(a) > 50 && Math.abs(b) > 50 && L > 10);

  if (shouldDarken) {
    return `#${convert.lab.hex([L - 10, a, b])}`;
  } else {
    return `#${convert.lab.hex([L + 10, a, b])}`;
  }
};

const getContrastColors = ({
  backgroundColor,
  foregroundColors,
}: {
  backgroundColor: string;
  foregroundColors: string[];
}) => {
  if (isColorLight(backgroundColor)) {
    const alternate = foregroundColors
      .map(textHex =>
        minimallyDarken({textHex, backgroundHex: backgroundColor}),
      )
      .filter(textHex => textHex != null) as string[];
    return ['#000000', ...alternate];
  } else {
    const alternate = foregroundColors
      .map(textHex =>
        minimallyLighten({textHex, backgroundHex: backgroundColor}),
      )
      .filter(textHex => textHex != null) as string[];
    return ['#ffffff', ...alternate];
  }
};

const minimallyLighten = ({
  textHex,
  backgroundHex,
}: {
  textHex: string;
  backgroundHex: string;
}) => {
  const [L, a, b] = convert.hex.lab(textHex);
  let attemptedLightness = L;

  while (attemptedLightness <= 100) {
    const hex = `#${convert.lab.hex([attemptedLightness, a, b])}`;
    if ((calcAPCA(hex, backgroundHex) as number) <= -75) {
      return hex;
    }
    attemptedLightness += 1;
  }

  return null;
};

const minimallyDarken = ({
  textHex,
  backgroundHex,
}: {
  textHex: string;
  backgroundHex: string;
}) => {
  const [L, a, b] = convert.hex.lab(textHex);
  let attemptedLightness = L;

  while (attemptedLightness >= 0) {
    const hex = `#${convert.lab.hex([attemptedLightness, a, b])}`;
    if ((calcAPCA(hex, backgroundHex) as number) >= 75) {
      return hex;
    }
    attemptedLightness -= 1;
  }

  return null;
};
