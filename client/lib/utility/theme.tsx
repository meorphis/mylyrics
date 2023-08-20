import React from 'react';
import ThemeType from '../types/theme';

// *** PUBLIC INTERFACE ***
// should be place near the top of the component tree - allows children to set and get theme
export const ThemeProvider = ({
  initialTheme,
  children,
}: {
  initialTheme?: ThemeType;
  children: React.ReactNode;
}) => {
  const [theme, setTheme] = React.useState<ThemeType>(
    initialTheme ?? {
      primaryColor: 'white',
      secondaryColor: 'white',
      backgroundColor: 'white',
      detailColor: 'white',
    },
  );

  return (
    <ThemeUpdateContext.Provider value={setTheme}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemeUpdateContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export const useThemeUpdate = () => {
  const context = React.useContext(ThemeUpdateContext);

  if (context === undefined) {
    throw new Error('useThemeUpdate must be used within a ThemeProvider');
  }

  return context;
};

const ThemeContext = React.createContext<ThemeType | undefined>(undefined);
const ThemeUpdateContext = React.createContext<
  ((theme: ThemeType) => void) | undefined
>(undefined);
