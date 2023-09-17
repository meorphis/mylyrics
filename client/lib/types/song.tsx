import {AlbumCoverColor} from './color';

export type RawSongType = {
  id: string;
  album: {
    name: string;
    image: {
      url: string;
      colors: AlbumCoverColor[];
    };
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
      colors: AlbumCoverColor[];
    };
  };
  name: string;
  artists: {
    name: string;
  }[];
  lyrics: string;
};
