import tinycolor, {ColorFormats} from 'tinycolor2';
import {rgba_to_lab, diff} from 'color-diff';
import ThemeType from '../types/theme';

export enum ButtonColorChoice {
  detailSaturated,
  detailUnsaturated,
  primarySaturated,
  primaryUnsaturated,
  secondarySaturated,
  secondaryUnsaturated,
}

export const addColorOpacity = (hexColor: string, opacity: number) => {
  if (!hexColor.includes('#')) {
    return hexColor;
  }

  let r = '',
    g = '',
    b = '';

  // 3 digits
  if (hexColor.length === 4) {
    r = '0x' + hexColor[1] + hexColor[1];
    g = '0x' + hexColor[2] + hexColor[2];
    b = '0x' + hexColor[3] + hexColor[3];
  }
  // 6 digits
  else if (hexColor.length === 7) {
    r = '0x' + hexColor[1] + hexColor[2];
    g = '0x' + hexColor[3] + hexColor[4];
    b = '0x' + hexColor[5] + hexColor[6];
  }

  const new_ = `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(
    b,
    16,
  )},${opacity})`;

  return new_;
};

export const lightenColor = (color: string, amount: number) => {
  return tinycolor(color).lighten(amount).toString();
};

// determines if a color is light for purposes of deciding whether to use a light or dark text color
export const isColorLight = (color: string) => {
  const {r, g, b} = tinycolor(color).toRgb();

  // Calculate brightness (standard formula from luminance)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; // 155 is standard optimal value for differentiation between light and dark
};

export const colorDistance = (color1: string, color2: string) => {
  return colorDistanceHsl(tinycolor(color1).toHsl(), tinycolor(color2).toHsl());
};

const colorDistanceHsl = (
  color1: ColorFormats.HSLA,
  color2: ColorFormats.HSLA,
) => {
  return diff(hslToLab(color1), hslToLab(color2));
};

const hslToLab = (hsl: {h: number; s: number; l: number}) => {
  const rgb = tinycolor(hsl).toRgb();
  return rgba_to_lab({
    R: rgb.r,
    G: rgb.g,
    B: rgb.b,
    A: rgb.a,
  });
};

export const buttonColorsForTheme = (
  theme: ThemeType,
  colorChoice: ButtonColorChoice,
) => {
  let themeColor;

  switch (colorChoice) {
    case ButtonColorChoice.detailSaturated:
    case ButtonColorChoice.detailUnsaturated:
      themeColor = theme.detailColor;
      break;
    case ButtonColorChoice.primarySaturated:
    case ButtonColorChoice.primaryUnsaturated:
      themeColor = theme.primaryColor;
      break;
    case ButtonColorChoice.secondarySaturated:
    case ButtonColorChoice.secondaryUnsaturated:
      themeColor = theme.secondaryColor;
      break;
  }

  // generally we use the detail color for the active tag, and the greyscale version of that for
  // the inactive tags, but if the detail color is close to grey to begin with, they end up too
  // similar -- so we add contrast; on a light background, we'll darken the greyscale color (or,
  // if needed lighten the detail color) whereas on a dark background we'll do the reverse
  let unsaturatedColor: string, saturatedColor: string;

  if (isColorLight(theme.backgroundColor)) {
    const contrastedColors = ensureColorContrast({
      lightenable: colorToGreyscale(themeColor),
      darkenable: themeColor,
      preference: 'lighten',
    });

    unsaturatedColor = contrastedColors.lightenable;
    saturatedColor = contrastedColors.darkenable;
  } else {
    const contrastedColors = ensureColorContrast({
      lightenable: themeColor,
      darkenable: colorToGreyscale(themeColor),
      preference: 'darken',
    });

    unsaturatedColor = contrastedColors.darkenable;
    saturatedColor = contrastedColors.lightenable;
  }

  switch (colorChoice) {
    case ButtonColorChoice.detailSaturated:
    case ButtonColorChoice.primarySaturated:
    case ButtonColorChoice.secondarySaturated:
      return saturatedColor;
    case ButtonColorChoice.detailUnsaturated:
    case ButtonColorChoice.primaryUnsaturated:
    case ButtonColorChoice.secondaryUnsaturated:
      return unsaturatedColor;
  }
};

// if two colors are too similar, lighten one and darken the other until they are sufficiently different
// will prefer lightening down to the minLightness before darkening
export const ensureColorContrast = ({
  lightenable,
  darkenable,
  preference,
  minDistance = 4.5, // CIEDE2000 color distance
  maxLightness = 0.9, // lightness when converted to HSL
  minLightness = 0.1, // lightness when converted to HSL
}: {
  lightenable: string;
  darkenable: string;
  preference: 'lighten' | 'darken';
  minDistance?: number;
  maxLightness?: number;
  minLightness?: number;
}) => {
  let hslLightenable = tinycolor(lightenable).toHsl();
  let hslDarkenable = tinycolor(darkenable).toHsl();

  // Check color distance
  while (getContrastRatio(hslLightenable, hslDarkenable) < minDistance) {
    const canLighten = hslLightenable.l < maxLightness;
    const canDarken = hslDarkenable.l > minLightness;

    if ((canLighten && preference === 'lighten') || !canDarken) {
      hslLightenable.l += Math.min(0.01, maxLightness - hslLightenable.l);
    } else if ((canDarken && preference === 'darken') || !canLighten) {
      hslDarkenable.l -= Math.min(0.01, hslDarkenable.l - minLightness);
    } else {
      // shouldn't happen unless the parameters are impossible to satisfy
      throw Error(
        `Could not adjust color contrast ${JSON.stringify(
          hslLightenable,
        )} ${JSON.stringify(hslDarkenable)}`,
      );
    }
  }

  // Convert back to string and return
  lightenable = tinycolor(hslLightenable).toHexString();
  darkenable = tinycolor(hslDarkenable).toHexString();

  return {lightenable, darkenable};
};

// converts a color to greyscale using the classic formula
export const colorToGreyscale = (color: string) => {
  // Remove the # from the color if it's there
  color = color.replace('#', '');

  // Convert to RGB
  let r = parseInt(color.substring(0, 2), 16);
  let g = parseInt(color.substring(2, 4), 16);
  let b = parseInt(color.substring(4, 6), 16);

  // Convert RGB to grayscale using the formula
  let gray = 0.299 * r + 0.587 * g + 0.114 * b;

  // Round the gray value to the nearest integer
  let grayInt = Math.round(gray);

  // Convert the decimal number to a hex string
  let grayHex = grayInt.toString(16);

  // Make sure each component has two digits
  if (grayHex.length < 2) {
    grayHex = '0' + grayHex;
  }

  // Construct the final color
  let grayColor = `#${grayHex}${grayHex}${grayHex}`;

  return grayColor;
};

const getContrastRatio = (
  color1: ColorFormats.HSLA,
  color2: ColorFormats.HSLA,
) => {
  const l1 = color1.l + 0.05;
  const l2 = color2.l + 0.05;

  return l1 > l2 ? l1 / l2 : l2 / l1;
};
