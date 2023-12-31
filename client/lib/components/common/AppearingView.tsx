import React from 'react';
import {useEffect} from 'react';
import {LayoutChangeEvent, TextStyle} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type AppearingComponentProps = {
  Component: React.ComponentType<any>;
  duration: number;
  style?: TextStyle;
  onLayout?: (event: LayoutChangeEvent) => void;
  skipAnimation?: boolean;
  delay?: number;
  children: React.ReactNode;
};

const AppearingComponent = (props: AppearingComponentProps) => {
  const {Component, duration, style, onLayout, skipAnimation, delay, children} =
    props;
  const opacity = useSharedValue(skipAnimation ? 1 : 0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      ...style,
    };
  });

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.quad),
      });
    }, delay ?? 0);
  }, []);

  return (
    <Component style={animatedStyles} onLayout={onLayout}>
      {children}
    </Component>
  );
};

const AppearingView = (props: Omit<AppearingComponentProps, 'Component'>) => {
  return (
    <AppearingComponent {...props} Component={Animated.View}>
      {props.children}
    </AppearingComponent>
  );
};

export default AppearingView;
