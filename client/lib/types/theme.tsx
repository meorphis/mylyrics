export type ThemeType = {
  backgroundColor: string;
  farBackgroundColor: string;
  textColors: string[];
  alternateThemes: ThemeType[];
  invertedTheme?: ThemeType;
};

export default ThemeType;
