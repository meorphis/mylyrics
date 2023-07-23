import React from 'react';
import ThemeType from '../types/theme';

type ThemeProviderProps = {
  children: React.ReactNode;
};

// *** PUBLIC INTERFACE ***
// should be place near the top of the component tree - allows children to set and get theme
export const ThemeProvider = (props: ThemeProviderProps) => {
  const [theme, setTheme] = React.useState<ThemeType>({
    primaryColor: 'white',
    secondaryColor: 'white',
    backgroundColor: 'white',
    detailColor: 'white',
  });

  return (
    <ThemeContext.Provider value={{theme, setTheme}}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const {theme, setTheme} = React.useContext(ThemeContext);

  // safe to assume these aren't null since we'll use the ThemeProvider near the
  // top of the component tree
  return {theme: theme!, setTheme: setTheme!};
};

const ThemeContext = React.createContext<{
  theme?: ThemeType;
  setTheme?: (theme: ThemeType) => void;
}>({});
