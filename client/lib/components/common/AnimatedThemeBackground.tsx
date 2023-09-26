import React, {useLayoutEffect, useRef} from 'react';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import {StyleSheet} from 'react-native';
import {
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {useActiveBundleThemeInfo} from '../../utility/redux/bundles/selectors';
import {ThemeType} from '../../types/theme';
import convert from 'color-convert';
import {useCommonSharedValues} from '../../utility/contexts/common_shared_values';
import {useDispatch} from 'react-redux';
import {setScrollToBundleIndex} from '../../utility/redux/bundles/slice';

type Props = {
  children: React.ReactNode;
};

type Mode = 'vertical_scroll' | 'horizontal_scroll_or_static';

// wraps the child component in a linear gradient background determined by the
// active passage's theme
const AnimatedThemeBackground = (props: Props) => {
  const {children} = props;

  const dispatch = useDispatch();

  const random = useRef<number>(Math.random());
  const {sharedDeckProgress, sharedDecksCarouselProgress} =
    useCommonSharedValues();
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

  useLayoutEffect(() => {
    const {bundleIndex, passageIndex} = sharedNextActivePassage.value;

    if (
      bundleIndex !== activeBundleIndex ||
      passageIndex !== activePassageIndex
    ) {
      sharedNextColors.value = colors;
      sharedNextActivePassage.value = {
        bundleIndex: activeBundleIndex,
        passageIndex: activePassageIndex,
      };

      if (bundleIndex !== activeBundleIndex) {
        sharedNextRandom.value = Math.random();
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
        console.log(
          `snapped to bundle ${curr.sharedDecksCarouselProgress}, passage ${curr.sharedDeckProgress}`,
        );
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
    return colorArrays[0].map((_, index) =>
      interpolateColor(
        value,
        inputRange,
        colorArrays.map(c => c[index]),
      ),
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
    <AnimatedLinearGradient
      style={styles.gradient}
      start={{x: 1.0, y: 0.0}}
      end={{x: 0.0, y: 1.0}}
      interpolatedColors={interpolatedColors}
      interpolatedProgress={interpolatedProgress}>
      {children}
    </AnimatedLinearGradient>
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

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    flexDirection: 'row',
  },
});

export default AnimatedThemeBackground;
