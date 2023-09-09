import React from 'react';
import {useTheme} from '../../utility/theme';
import ThemeBackground from './ThemeBackground';

type Props = {
  children: React.ReactNode;
};

// wraps the child component in a linear gradient background determined by the
// current theme
const DefaultThemeBackground = (props: Props) => {
  console.log('rendering DefaultThemeBackground');

  const theme = useTheme();

  return <ThemeBackground theme={theme} {...props} />;
};

export default DefaultThemeBackground;
