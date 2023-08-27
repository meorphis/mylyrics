import {ImageColorsResult} from 'react-native-image-colors';

export type RawSongType = {
  id: string;
  album: {
    name: string;
    image: string;
  };
  name: string;
  artists: {
    name: string;
  }[];
  lyrics: string;
};

export type SongType = {
  id: string;
  album: {
    name: string;
    image: {
      url: string;
      blob: string;
      colors: ImageColorsResult;
    };
  };
  name: string;
  artists: {
    name: string;
  }[];
  lyrics: string;
};
