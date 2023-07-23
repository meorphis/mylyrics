type SongType = {
  album: {
    name: string;
    image: string;
  };
  name: string;
  artist: {
    names: string[];
  };
};

export default SongType;
