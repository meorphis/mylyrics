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

export const isColorLight = (color: string) => {
  // Convert hex color to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate brightness (standard formula from luminance)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155; // 155 is standard optimal value for differentiation between light and dark
};

export const colorToComplementaryGrey = (color: string) => {
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
