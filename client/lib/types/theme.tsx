type InnerThemeType = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  detailColor: string;
};

type ThemeType = {
  main: InnerThemeType;
  contrast: InnerThemeType;
};

export default ThemeType;
