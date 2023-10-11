import {AlbumCoverColor} from './color';

// represents a song with some metadata
export type SongType = {
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