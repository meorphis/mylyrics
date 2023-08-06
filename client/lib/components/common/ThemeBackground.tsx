import React from 'react';
import AnimatedLinearGradient from '../recommendations/AnimatedLinearGradient';
import {addColorOpacity} from '../../utility/color';
import {StyleSheet, ViewStyle} from 'react-native';
import ThemeType from '../../types/theme';

type Props = {
  theme: ThemeType;
  style?: ViewStyle;
  children: React.ReactNode;
};

// wraps the child component in a linear gradient background determined by the
// provided theme
const ThemeBackground = (props: Props) => {
  console.log('rendering ThemeBackground');

  const {theme, style, children} = props;

  return (
    <AnimatedLinearGradient
      style={{...styles.gradient, ...style}}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1.0}}
      colors={[
        addColorOpacity(theme.backgroundColor, 0.6),
        addColorOpacity(theme.backgroundColor, 0.6),
      ]}>
      {children}
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default ThemeBackground;
