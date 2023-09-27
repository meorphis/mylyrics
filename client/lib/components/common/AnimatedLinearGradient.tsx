import React, {forwardRef} from 'react';
import NativeLinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedProps,
  AnimatedProps,
  SharedValue,
  useSharedValue,
} from 'react-native-reanimated';

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
  interpolatedColors: SharedValue<string[]> | SharedValue<number[]>;
  interpolatedProgress: SharedValue<number>;
  throttleMs: number;
};

const AnimatedGradientTransition: React.FC<
  AnimatedGradientTransitionProps
> = props => {
  const {
    interpolatedColors,
    interpolatedProgress,
    throttleMs,
    children,
    ...restProps
  } = props;

  const sharedLastUpdateTime = useSharedValue(0);
  const sharedThrottleMs = useSharedValue(throttleMs);

  // @ts-ignore
  const animatedProps = useAnimatedProps(() => {
    const currentTime = Date.now();
    if (currentTime - sharedLastUpdateTime.value < sharedThrottleMs.value) {
      return {}; // Return an empty object to skip updates
    }

    sharedLastUpdateTime.value = currentTime;

    return {
      colors: interpolatedColors.value,
      angle: interpolatedProgress.value * 360,
    };
  });

  return (
    <AnimatedLinearGradient
      {...restProps}
      colors={['white', 'white']}
      useAngle
      // @ts-ignore
      animatedProps={animatedProps}>
      {children}
    </AnimatedLinearGradient>
  );
};

export default AnimatedGradientTransition;
