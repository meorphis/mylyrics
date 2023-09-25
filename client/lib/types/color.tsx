// one of potentially several colors extracted from a particular album cover; matches
// the shape computed in the server
export type AlbumCoverColor = {
  area: number;
  blue: number;
  green: number;
  red: number;
  hex: string;
  hue: number;
  saturation: number;
  lightness: number;
  intensity: number;
};
