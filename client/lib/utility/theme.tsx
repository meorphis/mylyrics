import React from 'react';
import ThemeType from '../types/theme';
import {AlbumCoverColor} from '../types/color';
import {
  colorDistanceHsl,
  ensureColorContrast2,
  isColorLight,
  isColorVeryLight,
} from './color';
import {ColorFormats} from 'tinycolor2';
import tinycolor from 'tinycolor2';

// *** PUBLIC INTERFACE ***
// should be place near the top of the component tree - allows children to set and get theme
export const ThemeProvider = ({
  initialTheme,
  children,
}: {
  initialTheme?: ThemeType;
  children: React.ReactNode;
}) => {
  const [theme, setTheme] = React.useState<ThemeType>(
    initialTheme ?? {
      backgroundColor: 'white',
      textColors: ['white'],
      farBackgroundColor: 'white',
      alternateThemes: [],
    },
  );

  return (
    <ThemeUpdateContext.Provider value={setTheme}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemeUpdateContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export const useThemeUpdate = () => {
  const context = React.useContext(ThemeUpdateContext);

  if (context === undefined) {
    throw new Error('useThemeUpdate must be used within a ThemeProvider');
  }

  return context;
};

const ThemeContext = React.createContext<ThemeType | undefined>(undefined);
const ThemeUpdateContext = React.createContext<
  ((theme: ThemeType) => void) | undefined
>(undefined);

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
  let useGrey = false;

  const contrastedBackgroundColor = ensureColorContrast2({
    changeable: backgroundColor.hex,
    unchangeable: backgroundColor.hex,
    shouldDarkenFn: ({unchangeable}) => isColorVeryLight(unchangeable),
    minDistance: 10,
    distanceFn: colorDistanceHsl,
    lightenFn: (hslLightenable: ColorFormats.HSLA, maxLightness: number) => {
      // if the user will perceive the color as dark grey, we don't want the contrast color to
      // be colorful, so we just turn the contrast down to zero
      if (useGrey || hslLightenable.l * 10 + hslLightenable.s < 0.9) {
        hslLightenable.s = 0;
        useGrey = true;
      }
      hslLightenable.l += Math.min(0.01, maxLightness - hslLightenable.l);
    },
    darkenFn: (hslDarkenable: ColorFormats.HSLA, minLightness: number) => {
      if (useGrey || (1 - hslDarkenable.l) * 10 + (1 - hslDarkenable.s) < 0.9) {
        hslDarkenable.s = 0;
        useGrey = true;
      }

      hslDarkenable.l -= Math.min(0.01, hslDarkenable.l - minLightness);
    },
  });

  const mainBackgroundColor = invert
    ? backgroundColor.hex
    : contrastedBackgroundColor;

  const farBackgroundColor = invert
    ? contrastedBackgroundColor
    : backgroundColor.hex;

  return {
    backgroundColor: mainBackgroundColor,
    farBackgroundColor,
    textColors: getContrastColors({
      backgroundColor: mainBackgroundColor,
      foregroundColors: foregroundColors.map(c => c.hex),
    }),
    alternateThemes: [],
  };
};

const getContrastColors = ({
  backgroundColor,
  foregroundColors,
}: {
  backgroundColor: string;
  foregroundColors: string[];
}) => {
  const backgroundColorHsl = tinycolor(backgroundColor).toHsl();

  if (backgroundColorHsl.l < 0.25) {
    const alternate = foregroundColors
      .filter(color => tinycolor(color).toHsl().l < 0.9)
      .map(color => {
        const hsl = tinycolor(color).toHsl();
        return tinycolor({
          ...hsl,
          l: Math.max((backgroundColorHsl.l + 0.05) * 3 - 0.05, hsl.l),
        }).toHexString();
      });
    return ['#ffffff', ...alternate];
  } else if (backgroundColorHsl.l < 0.5) {
    return ['#ffffff'];
  } else if (backgroundColorHsl.l < 0.7) {
    return isColorLight(backgroundColor) ? ['#000000'] : ['#ffffff'];
  } else if (backgroundColorHsl.l < 0.8) {
    return ['#000000'];
  } else {
    const alternate = foregroundColors
      .filter(color => tinycolor(color).toHsl().l > 0.1)
      .map(color => {
        const hsl = tinycolor(color).toHsl();
        return tinycolor({
          ...hsl,
          l: Math.min((backgroundColorHsl.l - 0.05) / 3 + 0.05, hsl.l),
        }).toHexString();
      });
    return ['#000000', ...alternate];
  }
};
