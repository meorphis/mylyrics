import {AlbumCoverColor} from './color';

// the shape of a song that we receive/save from/to the server - we load the image blob and
// fill it in to convert to a SongType
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

// the shape of a song with sufficient information to render the metadata in the LyricsCard
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
