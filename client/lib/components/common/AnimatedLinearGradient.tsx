import React, {useEffect, forwardRef} from 'react';
import NativeLinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  interpolateColor,
  useAnimatedProps,
  AnimatedProps,
} from 'react-native-reanimated';
import _ from 'lodash';

type LinearGradientProps = React.ComponentProps<typeof NativeLinearGradient>;

const LinearGradient = forwardRef(
  (
    props: Omit<LinearGradientProps, 'colors'> &
      AnimatedProps<
        Partial<{
          colors: string[];
        }>
      >,
    ref: React.Ref<any>,
  ) => {
    const {children, ...otherProps} = props;

    return (
      // @ts-ignore
      <NativeLinearGradient ref={ref} {...otherProps}>
        {children}
      </NativeLinearGradient>
    );
  },
);

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

type AnimatedGradientTransitionProps = Omit<LinearGradientProps, 'colors'> & {
  colors: string[];
};

const AnimatedGradientTransition: React.FC<
  AnimatedGradientTransitionProps
> = props => {
  const {colors, children, ...restProps} = props;

  const sharedPrevColors = useSharedValue(colors);
  const sharedColors = useSharedValue(colors);
  const sharedAnimationValue = useSharedValue(0);

  useEffect(() => {
    if (!_.isEqual(sharedColors.value, colors)) {
      sharedColors.value = colors;
      sharedAnimationValue.value = 0;
      sharedAnimationValue.value = withTiming(
        1,
        {
          duration: 250,
          // easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
        () => {
          sharedPrevColors.value = sharedColors.value;
        },
      );
    }
  }, [colors]);

  const animatedProps = useAnimatedProps(() => {
    const interpolatedColors = sharedPrevColors.value.map((color, index) =>
      interpolateColor(
        sharedAnimationValue.value,
        [0, 1],
        [color, sharedColors.value[index]],
        'RGB',
      ),
    );

    return {
      colors: interpolatedColors,
    };
  });

  return (
    <AnimatedLinearGradient {...restProps} animatedProps={animatedProps}>
      {children}
    </AnimatedLinearGradient>
  );
};

export default AnimatedGradientTransition;
