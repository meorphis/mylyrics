import React from 'react';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import {useThemeAnimationValues} from '../../utility/contexts/theme_animation';
import {StyleSheet} from 'react-native';

type Props = {
  children: React.ReactNode;
};

// wraps the child component in a linear gradient background determined by the
// active passage's theme
const AnimatedThemeBackground = (props: Props) => {
  const {children} = props;

  const {interpolatedColors, interpolatedProgress} = useThemeAnimationValues();

  return (
    <AnimatedLinearGradient
      style={styles.gradient}
      start={{x: 1.0, y: 0.0}}
      end={{x: 0.0, y: 1.0}}
      interpolatedColors={interpolatedColors}
      interpolatedProgress={interpolatedProgress}
      throttleMs={16.7}>
      {children}
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    flexDirection: 'row',
  },
});

export default AnimatedThemeBackground;
