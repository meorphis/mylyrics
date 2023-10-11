import React, {useEffect, useRef} from 'react';
import {
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {useActiveBundleThemeInfo} from '../redux/bundles/selectors';
import {ThemeType} from '../../types/theme';
import convert from 'color-convert';
import {useDispatch} from 'react-redux';
import {setScrollToBundleIndex} from '../redux/bundles/slice';

type Mode = 'vertical_scroll' | 'horizontal_scroll_or_static';

// a provider component that computes and provides the shared values needed to
// perform animations according to the passages' themes
export const ThemeAnimationProvider = (props: {
  children: JSX.Element | JSX.Element[];
}) => {
  const {sharedDeckProgress, sharedDecksCarouselProgress} = useThemeProgress();

  const dispatch = useDispatch();

  const random = useRef<number>(Math.random());
  const sharedMode = useSharedValue<Mode>('horizontal_scroll_or_static');

  const {activePassageIndex, activeBundleIndex, themes} =
    useActiveBundleThemeInfo();

  const colors = themes.map(inner => inner.map(colorsForTheme));
  const sharedNextColors = useSharedValue(colors);
  const sharedSnappedColors = useSharedValue(sharedNextColors.value);
  const sharedNextActivePassage = useSharedValue({
    bundleIndex: activeBundleIndex,
    passageIndex: activePassageIndex,
  });
  const sharedSnappedActivePassage = useSharedValue(
    sharedNextActivePassage.value,
  );
  const sharedNextRandom = useSharedValue(random.current);
  const sharedSnappedRandom = useSharedValue(sharedNextRandom.value);

  useEffect(() => {
    sharedNextColors.value = colors;
  }, [colors]);

  useEffect(() => {
    const {bundleIndex, passageIndex} = sharedNextActivePassage.value;

    if (
      bundleIndex !== activeBundleIndex ||
      passageIndex !== activePassageIndex
    ) {
      sharedNextActivePassage.value = {
        bundleIndex: activeBundleIndex,
        passageIndex: activePassageIndex,
      };

      if (bundleIndex !== activeBundleIndex) {
        sharedNextRandom.value = nudgeRandomNumber({
          random: sharedSnappedRandom.value,
          forward: bundleIndex > activeBundleIndex,
        });
        dispatch(setScrollToBundleIndex(activeBundleIndex));
      }
    }
  }, [activeBundleIndex, activePassageIndex]);

  useAnimatedReaction(
    () => {
      return {
        sharedDeckProgress: sharedDeckProgress.value,
        sharedDecksCarouselProgress: sharedDecksCarouselProgress.value,
      };
    },
    (curr, prev) => {
      const currentlyVerticallyScrolling = curr.sharedDeckProgress % 1 !== 0;
      const currentlyHorizontallyScrolling =
        curr.sharedDecksCarouselProgress % 1 !== 0;
      const wasJustVerticallyScrolling =
        (prev?.sharedDeckProgress ?? 0) % 1 !== 0;
      const wasJustHorizontallyScrolling =
        (prev?.sharedDecksCarouselProgress ?? 0) % 1 !== 0;
      const justFinishedHorizontallyScrolling =
        !currentlyHorizontallyScrolling && wasJustHorizontallyScrolling;
      const justFinishedVerticallyScrolling =
        !currentlyVerticallyScrolling && wasJustVerticallyScrolling;

      if (currentlyVerticallyScrolling) {
        sharedMode.value = 'vertical_scroll';
      } else {
        sharedMode.value = 'horizontal_scroll_or_static';
      }

      if (
        justFinishedVerticallyScrolling ||
        justFinishedHorizontallyScrolling
      ) {
        // if we just finished vertically scrolling, we can get both the bundle and passage from
        // the progress of the carousels; if we just finished horizontally scrolling, we should not
        // get the passage from the progress of the carousel, we'll have moved to a new carousel
        // with new progress - instead pull it from the sharedNextActivePassage which was set up for
        // us in the useLayoutEffect above before the scroll
        sharedSnappedActivePassage.value = {
          bundleIndex: curr.sharedDecksCarouselProgress,
          passageIndex: justFinishedHorizontallyScrolling
            ? sharedNextActivePassage.value.passageIndex
            : curr.sharedDeckProgress,
        };
        sharedSnappedColors.value = sharedNextColors.value;
        sharedSnappedRandom.value = sharedNextRandom.value;
      }
    },
    [sharedNextActivePassage],
  );

  const interpolatedColors = useDerivedValue(() => {
    let value: number;
    let inputRange: number[];
    let colorArrays: string[][];

    switch (sharedMode.value) {
      case 'vertical_scroll':
        value = sharedDeckProgress.value;
        const unloopedColorArrays =
          sharedSnappedColors.value[
            sharedSnappedActivePassage.value.bundleIndex
          ];
        colorArrays = [...unloopedColorArrays, unloopedColorArrays[0]];
        inputRange = colorArrays.map((__, index) => index);
        break;
      case 'horizontal_scroll_or_static':
        value = sharedDecksCarouselProgress.value;
        colorArrays = [
          sharedSnappedColors.value[
            sharedSnappedActivePassage.value.bundleIndex
          ][sharedSnappedActivePassage.value.passageIndex],
          sharedNextColors.value[sharedNextActivePassage.value.bundleIndex][
            sharedNextActivePassage.value.passageIndex
          ],
        ];
        inputRange = [
          sharedSnappedActivePassage.value.bundleIndex,
          sharedNextActivePassage.value.bundleIndex,
        ];
        break;
      default:
        throw new Error(`invalid mode ${sharedMode.value}`);
    }
    return colorArrays[0].map(
      (_, index) =>
        interpolateColor(
          value,
          inputRange,
          colorArrays.map(c => c[index]),
        ) as unknown as number,
    );
  });

  const interpolatedProgress = useDerivedValue(() => {
    switch (sharedMode.value) {
      case 'vertical_scroll':
        return (
          (sharedSnappedRandom.value +
            interpolate(
              sharedDeckProgress.value,
              [
                0,
                sharedSnappedColors.value[
                  sharedSnappedActivePassage.value.bundleIndex
                ].length,
              ],
              [0, 1],
            )) %
          1
        );
      case 'horizontal_scroll_or_static':
        const snappedProgress =
          (sharedSnappedRandom.value +
            interpolate(
              sharedSnappedActivePassage.value.passageIndex,
              [
                0,
                sharedSnappedColors.value[
                  sharedSnappedActivePassage.value.bundleIndex
                ].length,
              ],
              [0, 1],
            )) %
          1;
        const nextProgress =
          (sharedNextRandom.value +
            interpolate(
              sharedNextActivePassage.value.passageIndex,
              [
                0,
                sharedNextColors.value[
                  sharedNextActivePassage.value.bundleIndex
                ].length,
              ],
              [0, 1],
            )) %
          1;
        return interpolate(
          sharedDecksCarouselProgress.value,
          [
            sharedSnappedActivePassage.value.bundleIndex,
            sharedNextActivePassage.value.bundleIndex,
          ],
          [snappedProgress, nextProgress],
        );
    }
  });

  return (
    <ThemeAnimationValuesContext.Provider
      value={{interpolatedProgress, interpolatedColors}}>
      {props.children}
    </ThemeAnimationValuesContext.Provider>
  );
};

export const ThemeProgressProvider = (props: {
  children: JSX.Element | JSX.Element[];
}) => {
  const sharedDeckProgress = useSharedValue(0);
  const sharedDecksCarouselProgress = useSharedValue(0);

  return (
    <ThemeProgressContext.Provider
      value={{sharedDeckProgress, sharedDecksCarouselProgress}}>
      {props.children}
    </ThemeProgressContext.Provider>
  );
};

// a hook that returns the shared values computed as an interpolated theme
export const useThemeAnimationValues = () => {
  const values = React.useContext(ThemeAnimationValuesContext)!;
  // assume it's not null because we'll only ever use this inside of a provider
  return values!;
};

// a hook the returns the values used to track the progress of the carousels, used to
// determine the interpolated theme
export const useThemeProgress = () => {
  const values = React.useContext(ThemeProgressContext)!;
  // assume it's not null because we'll only ever use this inside of a provider
  return values!;
};

const ThemeAnimationValuesContext = React.createContext<{
  interpolatedProgress: SharedValue<number>;
  interpolatedColors: SharedValue<number[]>;
} | null>(null);

const ThemeProgressContext = React.createContext<{
  sharedDeckProgress: SharedValue<number>;
  sharedDecksCarouselProgress: SharedValue<number>;
} | null>(null);

const colorsForTheme = (theme: ThemeType | null) => {
  if (theme === null) {
    return ['#ffffff', '#ffffff', '#ffffff', '#ffffff'];
  }

  return [
    theme.alternateThemes[1]?.backgroundColor ?? theme.farBackgroundColor,
    theme.farBackgroundColor,
    theme.alternateThemes[0]?.backgroundColor ?? theme.farBackgroundColor,
    theme.alternateThemes[2]?.backgroundColor ??
      theme.alternateThemes[0]?.backgroundColor ??
      theme.farBackgroundColor,
  ].sort((a, b) => convert.hex.lab(a)[0] - convert.hex.lab(b)[0]);
};

// adds a value between 0.1 and 0.2 or -0.1 and -0.2
const nudgeRandomNumber = ({
  random,
  forward,
}: {
  random: number;
  forward: boolean;
}) => {
  const nudge = 0.1 + Math.random() / 10;
  return random + (forward ? nudge : -nudge);
};
