import tinycolor from 'tinycolor2';
import {rgba_to_lab, diff} from 'color-diff';

// determines if a color is light for purposes of deciding whether to use a light or dark text color
export const isColorLight = (color: string) => {
  const {r, g, b} = tinycolor(color).toRgb();

  // Calculate brightness (standard formula from luminance)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; // 155 is standard optimal value for differentiation between light and dark
};

// determines the distance between two colors according to the CIEDE2000 algorithm
export const colorDistance = (color1: string, color2: string) => {
  return diff(
    hslToLab(tinycolor(color1).toHsl()),
    hslToLab(tinycolor(color2).toHsl()),
  );
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
