type SongType = {
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

export default SongType;
