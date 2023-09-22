import React, {useEffect, useRef} from 'react';
import ThemeType from '../types/theme';
import {AlbumCoverColor} from '../types/color';
import {colorDistance, isColorLight} from './color';
import convert from 'color-convert';
import {
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {calcAPCA} from 'apca-w3';

type ThemeInfo = {
  theme: ThemeType;
  interpolatedColors: Readonly<SharedValue<string[]>>;
  interpolatedProgress: Readonly<SharedValue<number>>;
};

type SetThemeInfo = {
  theme: ThemeType;
  groupThemeInfo: {
    groupKey: string;
    groupLength: number;
    passageIndex: number;
    themes: ThemeType[];
  };
};

type Mode = 'auto' | 'manual';

// *** PUBLIC INTERFACE ***
// should be place near the top of the component tree - allows children to set and get theme
export const ThemeProvider = ({
  initialTheme,
  children,
}: {
  initialTheme?: ThemeType;
  children: React.ReactNode;
}) => {
  const defaultTheme = initialTheme ?? {
    backgroundColor: 'white',
    textColors: ['white'],
    farBackgroundColor: 'white',
    alternateThemes: [],
  };

  const random = useRef<number>(Math.random());
  const sharedRandom = useSharedValue(random.current);

  const sharedProgress = useSharedValue(0);
  const mode = useSharedValue<Mode>('manual');

  // const interpolatedProgress = useDerivedValue(() => {
  //   return interpolate([baseProgress, progress.value], [0, 1]);
  // });

  const [themeInfo, setThemeInfo] = React.useState<SetThemeInfo>({
    theme: defaultTheme,
    groupThemeInfo: {
      groupKey: '',
      groupLength: 1,
      passageIndex: 0,
      themes: [defaultTheme, defaultTheme],
    },
  });

  const {
    theme,
    groupThemeInfo: {themes: groupThemes, groupKey, groupLength, passageIndex},
  } = themeInfo;

  const colors = colorsForTheme(theme);
  const groupColors = [...groupThemes, groupThemes[0]].map(colorsForTheme);

  const sharedPrevColors = useSharedValue(colors);
  const sharedColors = useSharedValue(colors);
  const sharedGroupColors = useSharedValue(groupColors);
  const sharedManualAnimationValue = useSharedValue(0);
  const sharedDerivedProgress = useSharedValue(0);
  const sharedGroupLength = useSharedValue(groupLength);

  useEffect(() => {
    sharedManualAnimationValue.value = 0;
    sharedColors.value = colors;
    sharedGroupColors.value = groupColors;
    sharedProgress.value = passageIndex;

    if (mode.value !== 'manual') {
      mode.value = 'manual';
    }
    sharedManualAnimationValue.value = withTiming(
      1,
      {
        duration: 500,
        // easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      () => {
        sharedPrevColors.value = sharedColors.value;
      },
    );
    sharedGroupLength.value = withTiming(groupLength, {
      duration: 500,
    });
  }, [groupKey, groupLength]);

  useAnimatedReaction(
    () => {
      return sharedProgress.value;
    },
    (curr, prev) => {
      // if curr is changing to an integer value, we might just be updating due to a
      // passageKey change (see useEffect above), but otherwise it's a sure sign that
      // the user is scrolling manually
      if (curr !== prev && curr % 1 !== 0 && mode.value === 'manual') {
        mode.value = 'auto';
      }

      // weird case where the carousel library abruptly jumps the progress to some
      // integer different from its actual value (apparently a bug in the library)
      if (
        mode.value === 'auto' &&
        curr % 1 === 0 &&
        Math.abs(curr - (prev ?? 0)) > 0.5
      ) {
        return;
      }

      sharedDerivedProgress.value = curr;
    },
    [mode, sharedProgress],
  );

  const interpolatedColors = useDerivedValue(() => {
    const value =
      mode.value === 'manual'
        ? sharedManualAnimationValue.value
        : sharedDerivedProgress.value;

    let inputRange: number[];
    let colorArrays: string[][];

    switch (mode.value) {
      case 'manual':
        colorArrays = [sharedPrevColors.value, sharedColors.value];
        inputRange = [0, 1];
        break;
      case 'auto':
        colorArrays = sharedGroupColors.value;
        inputRange = colorArrays.map((__, index) => index);
        break;
      default:
        throw new Error('invalid mode');
    }
    return colorArrays[0].map((_, index) =>
      interpolateColor(
        value,
        inputRange,
        colorArrays.map(c => c[index]),
      ),
    );
  });

  const interpolatedProgress = useDerivedValue(() => {
    return interpolate(
      (sharedDerivedProgress.value + sharedRandom.value) %
        sharedGroupLength.value,
      [0, sharedGroupLength.value],
      [0, 1],
    );
  });

  return (
    <ThemeUpdateContext.Provider value={{setThemeInfo, sharedProgress}}>
      <ThemeContext.Provider
        value={{
          theme: theme,
          interpolatedColors,
          interpolatedProgress,
        }}>
        {children}
      </ThemeContext.Provider>
    </ThemeUpdateContext.Provider>
  );
};

const colorsForTheme = (theme: ThemeType) => {
  return [
    theme.alternateThemes[1]?.backgroundColor ?? theme.farBackgroundColor,
    theme.farBackgroundColor,
    theme.alternateThemes[0]?.backgroundColor ?? theme.farBackgroundColor,
    theme.alternateThemes[2]?.backgroundColor ?? theme.farBackgroundColor,
  ].sort((a, b) => convert.hex.lab(a)[0] - convert.hex.lab(b)[0]);
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

  return {
    setThemeInfo: context.setThemeInfo,
    sharedProgress: context.sharedProgress!,
  };
};

const ThemeContext = React.createContext<ThemeInfo | undefined>(undefined);
const ThemeUpdateContext = React.createContext<{
  setThemeInfo: (info: SetThemeInfo) => void;
  sharedProgress: SharedValue<number> | null;
}>({
  setThemeInfo: () => {},
  sharedProgress: null,
});

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

  // if (backgroundL < 18) {
  //   const alternate = foregroundColors
  //     .filter(color => convert.hex.lab(color)[0] < 90)
  //     .map(color => {
  //       const [foregroundL, ...foregroundRest] = convert.hex.lab(color);
  //       const newL = Math.max((backgroundL + 5) * 3 - 5, foregroundL);
  //       return `#${convert.lab.hex([newL, ...foregroundRest])}`;
  //     });
  //   return ['#ffffff', ...alternate];
  // } else if (backgroundL < 50) {
  //   return ['#ffffff'];
  // } else if (backgroundL < 70) {
  //   return isColorLight(backgroundColor) ? ['#000000'] : ['#ffffff'];
  // } else if (backgroundL < 80) {
  //   return ['#000000'];
  // } else {
  //   const alternate = foregroundColors
  //     .filter(color => convert.hex.lab(color)[0] > 10)
  //     .map(color => {
  //       const [foregroundL, ...foregroundRest] = convert.hex.lab(color);
  //       const newL = Math.min((backgroundL - 5) / 4.5 + 5, foregroundL);
  //       return `#${convert.lab.hex([newL, ...foregroundRest])}`;
  //     });
  //   return ['#000000', ...alternate];
  // }
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
