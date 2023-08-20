import React from 'react';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import {addColorOpacity} from '../../utility/color';
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
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1.0}}
      colors={[
        addColorOpacity(theme.backgroundColor, 0.7),
        addColorOpacity(theme.backgroundColor, 0.4),
      ]}>
      {children}
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    flexDirection: 'row',
    padding: 6,
  },
});

export default ThemeBackground;
