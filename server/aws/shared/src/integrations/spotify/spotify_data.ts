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
    {after: lastCheckedRecentPlaysAt, limit: 50}
  );
  return spotifyResponse.body.items.map((item) => {
    return {
      song: getSimplifiedSongFromSpotifyTrack(item.track),
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
  
  const [artists, albums] = await Promise.all([
    batchRequests<SpotifyApi.MultipleArtistsResponse, SpotifyApi.ArtistObjectFull>(
      artistsIds, sp.getArtists.bind(sp), 50, body => body.artists
    ),
    batchRequests<SpotifyApi.MultipleAlbumsResponse, SpotifyApi.AlbumObjectFull>(
      albumIds, sp.getAlbums.bind(sp), 20, body => body.albums
    ),
  ]);

  return simplifiedSongs.map((song) => {
    const album = albums.find((album) => album.id == song.album.spotifyId);
    const artist = artists.find((artist) => artist.id == song.primaryArtist.spotifyId);

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

  return artistTopTracksResponse.body.tracks.map(getSimplifiedSongFromSpotifyTrack);
}



export const getTopArtistsForUser = async (
  {
    spotifyAccessToken, limit = 25, time_range = "short_term"
  }: {
    spotifyAccessToken: string,
    limit?: number,
    time_range?: "short_term" | "medium_term" | "long_term"
  }
): Promise<Artist[]> => {
  const sp = getSpotifyClient(spotifyAccessToken);
  const topArtistsResponse = await sp.getMyTopArtists({limit, time_range});

  return topArtistsResponse.body.items.map((artist) => {
    return {
      id: uuidForArtist({artistName: artist.name}),
      name: artist.name,
      popularity: artist.popularity,
      spotifyId: artist.id,
    }
  });
}

export const getTopTracksForUser = async (
  {
    spotifyAccessToken, time_range = "short_term"
  }: {
    spotifyAccessToken: string,
    time_range?: "short_term" | "medium_term" | "long_term"
  }
): Promise<SimplifiedSong[]> => {
  const sp = getSpotifyClient(spotifyAccessToken);
  const topTracksResponse = await sp.getMyTopTracks({limit: 50, time_range});
  return topTracksResponse.body.items.map(getSimplifiedSongFromSpotifyTrack);
}

// client for Spotify
const getSpotifyClient = (accessToken: string) => {
  const sp = new SpotifyWebApi();
  sp.setAccessToken(accessToken);
  return sp;
}

const getSimplifiedSongFromSpotifyTrack = (track: SpotifyApi.TrackObjectFull): SimplifiedSong => {
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
    isrc: track.external_ids.isrc,
    spotifyId: track.id,
    isExplicit: track.explicit,
    artists,
    primaryArtist: artists[0],
    album: {
      spotifyId: track.album.id,
    }
  }
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
  