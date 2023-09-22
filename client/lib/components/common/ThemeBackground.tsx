import React from 'react';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import {StyleSheet} from 'react-native';
import ThemeType from '../../types/theme';
import {useTheme} from '../../utility/theme';

type Props = {
  theme: ThemeType;
  children: React.ReactNode;
};

// wraps the child component in a linear gradient background determined by the
// provided theme
const ThemeBackground = (props: Props) => {
  console.log('rendering ThemeBackground');

  const {children} = props;

  const {interpolatedColors, interpolatedProgress} = useTheme();

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

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    flexDirection: 'row',
  },
});

export default ThemeBackground;
