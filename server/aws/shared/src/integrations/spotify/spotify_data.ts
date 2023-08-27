import SpotifyWebApi from "spotify-web-api-node";
import { uuidForArtist, uuidForSong } from "../../utility/uuid";
import { Song, SimplifiedSong, SongListen, Artist } from "../../utility/types";

// *** PUBLIC INTERFACE ***
// takes a spotify access token and the time at which we last checked and
// returns the user's recent song listens
export const getUserRecentlyPlayedSongs = async (
  {spotifyAccessToken, lastCheckedRecentPlaysAt}:
  {spotifyAccessToken: string, lastCheckedRecentPlaysAt: number | undefined}
): Promise<SongListen[]> => {
  const sp = getSpotifyClient(spotifyAccessToken);

  const spotifyResponse = await sp.getMyRecentlyPlayedTracks(
    {after: lastCheckedRecentPlaysAt, limit: 25}
  );
  return spotifyResponse.body.items.map((item) => {
    const artists = item.track.artists.map((artist) => {
      return {
        id: uuidForArtist({artistName: artist.name}),
        name: artist.name,
        spotifyId: artist.id,
      }
    });

    return {
      song: {
        id: uuidForSong({songName: item.track.name, artistName: artists[0].name}),
        name: item.track.name,
        popularity: item.track.popularity,
        isrc: item.track.external_ids.isrc,
        spotifyId: item.track.id,
        isExplicit: item.track.explicit,
        artists,
        primaryArtist: artists[0],
        album: {
          spotifyId: item.track.album.id,
        }
      },
      metadata: {
        playedAt: new Date(item.played_at).getTime(),
        playedFrom: item.context?.type,
      }
    }
  });
}

// takes a list of simplified songs and returns the same list of songs but with additional data
// from spotify about the artist and album and audio features
export const getEnrichedSongs = async (
  {spotifyAccessToken, simplifiedSongs}: 
  {spotifyAccessToken: string, simplifiedSongs: SimplifiedSong[]}
): Promise<Song[]> => {  
  const sp = getSpotifyClient(spotifyAccessToken);
  const artistsIds = Array.from(
    new Set(simplifiedSongs.map((song) => song.primaryArtist.spotifyId))
  );
  const albumIds = Array.from(new Set(simplifiedSongs.map((song) => song.album.spotifyId)));
  const trackIds = simplifiedSongs.map((song) => song.spotifyId);

  // eslint-disable-next-line max-len
  console.log(`querying the spotify api for ${artistsIds.length} artists, ${albumIds.length} albums, and ${trackIds.length} tracks`);
  
  const [artists, albums, audioFeatures] = await Promise.all([
    batchRequests<SpotifyApi.MultipleArtistsResponse, SpotifyApi.ArtistObjectFull>(
      artistsIds, sp.getArtists.bind(sp), 50, body => body.artists
    ),
    batchRequests<SpotifyApi.MultipleAlbumsResponse, SpotifyApi.AlbumObjectFull>(
      albumIds, sp.getAlbums.bind(sp), 20, body => body.albums
    ),
    batchRequests<SpotifyApi.MultipleAudioFeaturesResponse, SpotifyApi.AudioFeaturesObject>(
      trackIds, sp.getAudioFeaturesForTracks.bind(sp), 100, body => body.audio_features
    ),
  ]);

  return simplifiedSongs.map((song, i) => {
    const album = albums.find((album) => album.id == song.album.spotifyId);
    const artist = artists.find((artist) => artist.id == song.primaryArtist.spotifyId);
    const audioFeatureMap = audioFeatures[i];

    if (album == null) {
      throw new Error(
        `could not find album for song ${song.name} by artist ${song.primaryArtist.name}`
      );
    }

    if (artist == null) {
      throw new Error(
        `could not find artist for song ${song.name} by artist ${song.primaryArtist.name}`
      );
    }
    
    return {
      ...song,
      features: {
        acousticness: audioFeatureMap.acousticness,
        danceability: audioFeatureMap.danceability,
        energy: audioFeatureMap.energy,
        instrumentalness: audioFeatureMap.instrumentalness,
        liveness: audioFeatureMap.liveness,
        loudness: audioFeatureMap.loudness,
        speechiness: audioFeatureMap.speechiness,
        tempo: audioFeatureMap.tempo,
        valence: audioFeatureMap.valence,
      },
      artists: song.artists,
      primaryArtist: {
        ...song.primaryArtist,
        popularity: artist.popularity,
      },
      album: {
        ...song.album,
        name: album.name,
        genres: album.genres,
        image: album.images[0],
        releaseDate: album.release_date,
      }
    }
  })
}

// takes a spotify access token and an artist's spotify id and returns the names of the artist's
// top tracks
export const getTopSongsForArtist = async (
  {artistSpotifyId, spotifyAccessToken}: {artistSpotifyId: string, spotifyAccessToken: string}
): Promise<SimplifiedSong[]> => {
  const sp = getSpotifyClient(spotifyAccessToken);
  const artistTopTracksResponse = await sp.getArtistTopTracks(
    artistSpotifyId, "US"
  );

  return artistTopTracksResponse.body.tracks.map((track) => {
    const artists = track.artists.map((artist) => {
      return {
        id: uuidForArtist({artistName: artist.name}),
        name: artist.name,
        spotifyId: artist.id,
      }
    });

    return {
      id: uuidForSong({songName: track.name, artistName: artists[0].name}),
      name: track.name,
      popularity: track.popularity,
      spotifyId: track.id,
      isExplicit: track.explicit,
      isrc: track.external_ids.isrc,
      artists,
      primaryArtist: artists[0],
      album: {
        spotifyId: track.album.id,
      }
    }
  })    
}

export const getTopArtistsForUser = async (
  {spotifyAccessToken}: {spotifyAccessToken: string}
): Promise<Artist[]> => {
  const sp = getSpotifyClient(spotifyAccessToken);
  const topArtistsResponse = await sp.getMyTopArtists({limit: 20, time_range: "short_term"});

  return topArtistsResponse.body.items.map((artist) => {
    return {
      id: uuidForArtist({artistName: artist.name}),
      name: artist.name,
      popularity: artist.popularity,
      spotifyId: artist.id,
    }
  });
}

// client for Spotify
const getSpotifyClient = (accessToken: string) => {
  const sp = new SpotifyWebApi();
  sp.setAccessToken(accessToken);
  return sp;
}

interface SpotifyResponse<T> {
  body: T;
}

type SpotifyFetcher<T> = (
  ids: readonly string[]
) => Promise<SpotifyResponse<T>>;
type Extractor<T, R> = (response: T) => R[];

async function batchRequests<T, R>(
  ids: string[], fetchFunction: SpotifyFetcher<T>,
  batchSize: number, extractor: Extractor<T, R>,
): Promise<R[]> {
  let responses: R[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const response = await fetchFunction(batch);
    responses = responses.concat(extractor(response.body));
  }

  return responses;
}
  