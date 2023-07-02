module.exports = ({ config } : {config : any}) => {
    return {
      ...config,
      extra: {
        ...config.extra,
        spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
        spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      },
    };
  };