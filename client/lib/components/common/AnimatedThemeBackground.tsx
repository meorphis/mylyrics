import React, {useEffect, useRef} from 'react';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import {StyleSheet} from 'react-native';
import {
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useActiveBundleThemeInfo} from '../../utility/redux/bundles/selectors';
import {ThemeType} from '../../types/theme';
import convert from 'color-convert';
import {useCommonSharedValues} from '../../utility/contexts/common_shared_values';

type Props = {
  children: React.ReactNode;
};

type Mode = 'auto' | 'manual';

// wraps the child component in a linear gradient background determined by the
// active passage's theme
const AnimatedThemeBackground = (props: Props) => {
  const {children} = props;

  const random = useRef<number>(Math.random());
  const sharedRandom = useSharedValue(random.current);
  const {sharedDeckProgress: sharedProgress} = useCommonSharedValues();
  const sharedMode = useSharedValue<Mode>('manual');

  const {
    activePassageTheme,
    bundleThemeInfo: {bundleThemes, bundleKey, bundleLength, passageIndex},
  } = useActiveBundleThemeInfo();

  const activePassageColors = colorsForTheme(activePassageTheme);
  const bundleColors = [...bundleThemes, bundleThemes[0]].map(colorsForTheme);

  const sharedPrevPassageColors = useSharedValue(activePassageColors);
  const sharedPassageColors = useSharedValue(activePassageColors);
  const sharedBundleColors = useSharedValue(bundleColors);
  const sharedManualAnimationValue = useSharedValue(0);
  const sharedDerivedProgress = useSharedValue(0);
  const sharedGroupLength = useSharedValue(bundleLength);

  useEffect(() => {
    sharedManualAnimationValue.value = 0;
    sharedPassageColors.value = activePassageColors;
    sharedBundleColors.value = bundleColors;
    sharedProgress.value = passageIndex;

    if (sharedMode.value !== 'manual') {
      sharedMode.value = 'manual';
    }
    sharedManualAnimationValue.value = withTiming(
      1,
      {
        duration: 500,
        // easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      () => {
        sharedPrevPassageColors.value = sharedPassageColors.value;
      },
    );
    sharedGroupLength.value = withTiming(bundleLength, {
      duration: 500,
    });
  }, [bundleKey, bundleLength]);

  useAnimatedReaction(
    () => {
      return sharedProgress.value;
    },
    (curr, prev) => {
      // if curr is changing to an integer value, we might just be updating due to a
      // passageKey change (see useEffect above), but otherwise it's a sure sign that
      // the user is scrolling manually
      if (curr !== prev && curr % 1 !== 0 && sharedMode.value === 'manual') {
        sharedMode.value = 'auto';
      }

      // weird case where the carousel library abruptly jumps the progress to some
      // integer different from its actual value (apparently a bug in the library)
      if (
        sharedMode.value === 'auto' &&
        curr % 1 === 0 &&
        Math.abs(curr - (prev ?? 0)) > 0.5
      ) {
        return;
      }

      sharedDerivedProgress.value = curr;
    },
    [sharedMode, sharedProgress],
  );

  const interpolatedColors = useDerivedValue(() => {
    const value =
      sharedMode.value === 'manual'
        ? sharedManualAnimationValue.value
        : sharedDerivedProgress.value;

    let inputRange: number[];
    let colorArrays: string[][];

    switch (sharedMode.value) {
      case 'manual':
        colorArrays = [
          sharedPrevPassageColors.value,
          sharedPassageColors.value,
        ];
        inputRange = [0, 1];
        break;
      case 'auto':
        colorArrays = sharedBundleColors.value;
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
