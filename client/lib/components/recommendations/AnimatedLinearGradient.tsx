// forked from https://github.com/react-native-linear-gradient/react-native-linear-gradient/blob/e7737fcf6da971a3b9f849aa2a6dbb5fe844a5fd/example/src/AnimatedGradientTransition.js

import React, {Component} from 'react';
import {Animated, Easing, EasingFunction} from 'react-native';
import _ from 'lodash';

import NativeLinearGradient from 'react-native-linear-gradient';

type LinearGradientProps = React.ComponentProps<typeof NativeLinearGradient>;

class LinearGradient extends Component<LinearGradientProps> {
  // Generate back the colors array with all transformed props
  _generateColorsArray(props: LinearGradientProps) {
    const propsKeys = Object.keys(props);
    const colorsArray: string[] = [];

    propsKeys.forEach(key => {
      if (
        key.indexOf('animatedColor') !== -1 &&
        key in props &&
        typeof props[key as keyof LinearGradientProps] === 'string'
      ) {
        colorsArray.push(props[key as keyof LinearGradientProps] as string);
      }
    });

    return colorsArray;
  }

  render() {
    const {children, ...props} = this.props;
    const colorsArray = this._generateColorsArray(props);
    const nativeLinearProps = _.omit(props, Object.keys(colorsArray));

    return (
      <NativeLinearGradient {...nativeLinearProps} colors={colorsArray}>
        {children}
      </NativeLinearGradient>
    );
  }
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

type AnimatedGradientTransitionProps = LinearGradientProps & {
  animation: {
    toValue: number;
    duration: number;
    easing: EasingFunction;
  };
};

type AnimatedGradientTransitionState = {
  colors: (string | number)[];
  prevColors: (string | number)[];
  animatedColors: Animated.Value[];
};

class AnimatedGradientTransition extends Component<
  AnimatedGradientTransitionProps,
  AnimatedGradientTransitionState
> {
  static defaultProps = {
    animation: {
      toValue: 1,
      duration: 500,
      easing: Easing.linear,
    },
  };

  constructor(props: AnimatedGradientTransitionProps) {
    super(props);

    this.state = {
      colors: props.colors,
      prevColors: props.colors,
      animatedColors: props.colors.map(() => new Animated.Value(0)),
    };
  }

  static getDerivedStateFromProps(
    nextProps: AnimatedGradientTransitionProps,
    prevState: AnimatedGradientTransitionState,
  ) {
    const keys = ['colors'];
    const mutableProps = _.pick(nextProps, keys);
    const stateToCompare = _.pick(prevState, keys);
    let animatedColors = prevState.animatedColors;

    animatedColors = AnimatedGradientTransition.animateGradientTransition(
      animatedColors,
      mutableProps.colors!,
      prevState.colors,
      nextProps.animation,
    );

    if (!_.isEqual(mutableProps, stateToCompare)) {
      return {
        ...mutableProps,
        animatedColors,
        prevColors: prevState.colors,
      };
    }

    return null;
  }

  static animateGradientTransition(
    animatedColors: Animated.Value[],
    curColors: (string | number)[],
    prevColors: (string | number)[],
    animation: {
      toValue: number;
      duration: number;
      easing: EasingFunction;
    },
  ) {
    // Animate only if the new colors are different
    if (!_.isEqual(prevColors, curColors)) {
      // Update number of animatedValue if the length is different
      if (animatedColors.length !== curColors.length) {
        animatedColors = curColors.map(() => new Animated.Value(0));
      } else {
        animatedColors.forEach(animatedColor => animatedColor.setValue(0));
      }

      // Parallel animation of all background colors
      Animated.parallel(
        animatedColors.map(animatedColor => {
          return Animated.timing(animatedColor, {
            toValue: animation.toValue,
            duration: animation.duration,
            easing: animation.easing,
            useNativeDriver: false,
          });
        }),
      ).start();
    }

    return animatedColors;
  }

  _getColorSafely(colors: (string | number)[], index: number) {
    if (colors[index]) {
      return colors[index];
    }

    return colors.slice(-1)[0];
  }

  _getInterpolatedColors() {
    const {colors, prevColors, animatedColors} = this.state;

    return animatedColors.map((animatedColor, index) => {
      return animatedColor.interpolate({
        inputRange: [0, 1],
        outputRange: [
          this._getColorSafely(prevColors, index),
          this._getColorSafely(colors, index),
        ] as string[] | number[],
      });
    });
  }

  // Send all colors as props to enable Animated api to transform it
  _generateColorsProps(
    interpolatedColors: Animated.AnimatedInterpolation<string | number>[],
  ) {
    let props = {};

    interpolatedColors.forEach((interpolateColor, index) => {
      const key = `animatedColor${index}`;

      props = _.merge(props, {
        [key]: interpolateColor,
      });

      return {
        [key]: interpolateColor,
      };
    });

    return props;
  }

  render() {
    const {children, ...props} = this.props;
    const interpolatedColors = this._getInterpolatedColors();
    const animatedColorsProps = this._generateColorsProps(interpolatedColors);

    return (
      <AnimatedLinearGradient {...props} {...animatedColorsProps}>
        {children}
      </AnimatedLinearGradient>
    );
  }
}

export default AnimatedGradientTransition;
