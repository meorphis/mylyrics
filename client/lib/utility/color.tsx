import tinycolor, {ColorFormats} from 'tinycolor2';
import {rgba_to_lab, diff} from 'color-diff';

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

export const isColorVeryLight = (color: string) => {
  const {r, g, b} = tinycolor(color).toRgb();

  // Calculate brightness (standard formula from luminance)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200;
};

export const colorDistance = (color1: string, color2: string) => {
  return colorDistanceHsl(tinycolor(color1).toHsl(), tinycolor(color2).toHsl());
};

export const colorDistanceHsl = (
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

// if two colors are too similar, lighten one and darken the other until they are sufficiently different
// will prefer lightening down to the minLightness before darkening
export const ensureColorContrast = ({
  lightenable,
  darkenable,
  preference,
  minDistance = 4.5, // contrast ratio
  maxLightness = 0.9, // lightness when converted to HSL
  minLightness = 0.1, // lightness when converted to HSL
  distanceFn = getContrastRatio,
  lightenFn = (hslLightenable: ColorFormats.HSLA, maxLightness: number) => {
    hslLightenable.l += Math.min(0.01, maxLightness - hslLightenable.l);
  },
  darkenFn = (hslDarkenable: ColorFormats.HSLA, minLightness: number) => {
    hslDarkenable.l -= Math.min(0.01, hslDarkenable.l - minLightness);
  },
}: {
  lightenable: string;
  darkenable: string;
  preference: 'lighten' | 'darken';
  minDistance?: number;
  maxLightness?: number;
  minLightness?: number;
  distanceFn?: (color1: ColorFormats.HSLA, color2: ColorFormats.HSLA) => number;
  lightenFn?: (hslLightenable: ColorFormats.HSLA, maxLightness: number) => void;
  darkenFn?: (hslDarkenable: ColorFormats.HSLA, minLightness: number) => void;
  lightnessSaturationSwap?: boolean;
}) => {
  let hslLightenable = tinycolor(lightenable).toHsl();
  let hslDarkenable = tinycolor(darkenable).toHsl();

  // Check color distance
  while (distanceFn(hslLightenable, hslDarkenable) < minDistance) {
    const canLighten = hslLightenable.l < maxLightness;
    const canDarken = hslDarkenable.l > minLightness;

    if ((canLighten && preference === 'lighten') || !canDarken) {
      lightenFn(hslLightenable, maxLightness);
    } else if ((canDarken && preference === 'darken') || !canLighten) {
      darkenFn(hslDarkenable, minLightness);
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

// similar to ensureColorContrast, but will pre-select which color to lighten/darken, and then
// decide which to do based on the shouldDarkenFn
export const ensureColorContrast2 = ({
  changeable,
  unchangeable,
  shouldDarkenFn = ({unchangeable}: {unchangeable: string}) =>
    isColorLight(unchangeable),
  minDistance = 4.5,
  distanceFn,
  lightenFn,
  darkenFn,
}: {
  changeable: string;
  unchangeable: string;
  shouldDarkenFn?: ({
    changeable,
    unchangeable,
  }: {
    changeable: string;
    unchangeable: string;
  }) => boolean;
  minDistance?: number;
  distanceFn?: (color1: ColorFormats.HSLA, color2: ColorFormats.HSLA) => number;
  lightenFn?: (hslLightenable: ColorFormats.HSLA, maxLightness: number) => void;
  darkenFn?: (hslDarkenable: ColorFormats.HSLA, minLightness: number) => void;
}) => {
  const shouldDarken = shouldDarkenFn({changeable, unchangeable});

  const contrastedColors = ensureColorContrast({
    lightenable: shouldDarken ? unchangeable : changeable,
    darkenable: shouldDarken ? changeable : unchangeable,
    preference: shouldDarken ? 'darken' : 'lighten',
    minDistance,
    distanceFn,
    lightenFn,
    darkenFn,
  });

  return shouldDarken
    ? contrastedColors.darkenable
    : contrastedColors.lightenable;
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

export const getContrastRatio = (
  color1: ColorFormats.HSLA,
  color2: ColorFormats.HSLA,
) => {
  const l1 = color1.l + 0.05;
  const l2 = color2.l + 0.05;

  return l1 > l2 ? l1 / l2 : l2 / l1;
};
