import React from 'react';
import {useTheme} from '../utility/theme';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import {addColorOpacity} from '../utility/color';
import {StyleSheet} from 'react-native';

type Props = {
  children: React.ReactNode;
};

// wraps the child component in a linear gradient background determined by the
// current theme
const ThemeBackground = (props: Props) => {
  const {theme} = useTheme();

  return (
    <AnimatedLinearGradient
      style={styles.gradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1.0}}
      colors={[
        addColorOpacity(theme.backgroundColor, 0.7),
        addColorOpacity(theme.backgroundColor, 0.3),
      ]}>
      {props.children}
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default ThemeBackground;
