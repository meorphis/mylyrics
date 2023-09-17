import React from 'react';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import {StyleSheet} from 'react-native';
import ThemeType from '../../types/theme';

type Props = {
  theme: ThemeType;
  children: React.ReactNode;
};

// wraps the child component in a linear gradient background determined by the
// provided theme
const ThemeBackground = (props: Props) => {
  console.log('rendering ThemeBackground');

  const {theme, children} = props;

  return (
    <AnimatedLinearGradient
      style={styles.gradient}
      start={{x: 0, y: 0.0}}
      end={{x: 1.0, y: 1.0}}
      colors={[
        theme.farBackgroundColor,
        theme.alternateThemes[0]?.backgroundColor ?? theme.farBackgroundColor,
        theme.alternateThemes[1]?.backgroundColor ?? theme.farBackgroundColor,
        theme.alternateThemes[2]?.backgroundColor ?? theme.farBackgroundColor,
      ]}>
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
