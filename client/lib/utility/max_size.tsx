import {useFontSize} from './font_size';

export type ScaleType = {
  index: number;
  lyricsFontSize: number;
  songNameSize: number;
  artistNameSize: number;
  albumNameSize: number;
  albumImageSize: number;
};

export type ScaleInfoType = {
  scale: ScaleType;
  computed: boolean;
};

const scales = [
  {
    index: 0,
    lyricsFontSize: 20,
    songNameSize: 18,
    artistNameSize: 16,
    albumNameSize: 14,
    albumImageSize: 100,
  },
  {
    index: 1,
    lyricsFontSize: 18,
    songNameSize: 16,
    artistNameSize: 15,
    albumNameSize: 13,
    albumImageSize: 90,
  },
  {
    index: 2,
    lyricsFontSize: 16,
    songNameSize: 15,
    artistNameSize: 13,
    albumNameSize: 13,
    albumImageSize: 80,
  },
  {
    index: 3,
    lyricsFontSize: 14,
    songNameSize: 14,
    artistNameSize: 12,
    albumNameSize: 12,
    albumImageSize: 70,
  },
  {
    index: 4,
    lyricsFontSize: 12,
    songNameSize: 13,
    artistNameSize: 11,
    albumNameSize: 11,
    albumImageSize: 60,
  },
  {
    index: 5,
    lyricsFontSize: 10,
    songNameSize: 12,
    artistNameSize: 10,
    albumNameSize: 10,
    albumImageSize: 50,
  },
  {
    index: 6,
    lyricsFontSize: 8,
    songNameSize: 10,
    artistNameSize: 8,
    albumNameSize: 8,
    albumImageSize: 40,
  },
  {
    index: 7,
    lyricsFontSize: 6,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 8,
    lyricsFontSize: 4,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 9,
    lyricsFontSize: 2,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 10,
    lyricsFontSize: 1,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
];

export const useGetScaleForContainerHeight = () => {
  const {heights: fontSizeHeights} = useFontSize();
  return ({
    containerHeight,
    numTextLines,
    actionBarHeight,
  }: {
    containerHeight: number;
    numTextLines: number;
    actionBarHeight: number;
  }) => {
    for (let i = 0; i < scales.length; i++) {
      const scale = scales[i];
      const {lyricsFontSize, albumImageSize} = scale;
      const lyricsFontHeight = fontSizeHeights[lyricsFontSize];
      const lyricsHeight = lyricsFontHeight * numTextLines;

      const totalHeight = albumImageSize + lyricsHeight + actionBarHeight;

      console.log(
        'totalHeight',
        totalHeight,
        'containerHeight',
        containerHeight,
        'heights',
        JSON.stringify(fontSizeHeights),
      );

      if (totalHeight <= containerHeight) {
        return scale;
      }
    }

    return scales[scales.length - 1];
  };
};

export const DEFAULT_SCALE = scales[0];
