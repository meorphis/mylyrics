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

  const sharedValue = useSharedValue(0);

  useEffect(() => {
    if (!_.isEqual(sharedPrevColors.value, colors)) {
      sharedColors.value = colors;
      sharedValue.value = 0;
      sharedValue.value = withTiming(
        1,
        {
          duration: 250,
          // easing: Easing.linear,
        },
        () => {
          sharedPrevColors.value = sharedColors.value;
        },
      );
    }
  }, [colors]);

  const colorProps = useAnimatedProps(() => {
    const interpolatedColors = sharedPrevColors.value.map((color, index) =>
      interpolateColor(
        sharedValue.value,
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
    <AnimatedLinearGradient {...restProps} animatedProps={colorProps}>
      {children}
    </AnimatedLinearGradient>
  );
};

export default AnimatedGradientTransition;
