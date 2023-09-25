// the theme for a passage/song, created by mapping the album cover colors to a
// set of colors suitable for rendering the UI
export type ThemeType = {
  backgroundColor: string;
  farBackgroundColor: string;
  textColors: string[];
  alternateThemes: ThemeType[];
  invertedTheme?: ThemeType;
};

// a particular selection of a theme, potentially indicating that we should use
// the invertedTheme when we render it
export type ThemeSelection = {
  theme: ThemeType;
  inverted: boolean;
};

export default ThemeType;
