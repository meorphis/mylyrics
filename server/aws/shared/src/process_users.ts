import {getFreshSpotifyToken} from "./integrations/spotify/spotify_auth";
import {
  ScanCommand,
  GetItemCommand,
  QueryCommand,
  PutItemCommand,
  AttributeValue
} from "@aws-sdk/client-dynamodb";
import { uuidForArtist, uuidForSong } from "./utility/uuid";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { dbClient, getSpotifyClient, sqs } from "./utility/clients";
import { Song } from "./utility/types";

// *** CONSTANTS ***
const SONG_LISTEN_EXPIRATION_SECONDS = 60 * 60 * 24 * 28; // 28 days
const MAX_SONGS_PER_ARTIST = 10;

// *** PUBLIC INTERFACE ***
// for each user in the database, we add some data to dynamo and search depending on the user's
// listening activity
// notes:
// - first we check if the user is newly listening to a song; if so, we record the listen
// - then if our system hasn't seen the song before, we add the song to the processing queue 
// - we also add the artist's top tracks to the processing queue if we haven't seen the 
//    artist before
export const processUsers = async () => {
  // make sure we have all the environment variables we need
  assertEnvironmentVariables();

  // we'll do a full scan until it doesn't scale anymore
  const users = await dbClient.send(new ScanCommand({
    TableName: process.env.USER_TABLE_NAME,
  }));

  if (users.Items == null) {
    throw new Error(`failed to get users from dynamo
      output: ${JSON.stringify(users)}
    `);
  }

  await Promise.all(users.Items.map(processOneUser));
}

// *** PRIVATE HELPERS ***
const processOneUser = async (userObj: Record<string, AttributeValue>) => {  
  const userId = userObj.userId["S"];

  console.log(`processing user ${userId}`);

  // sanity check
  if (userId == null) {
    throw new Error(`user object ${JSON.stringify(userObj)} has no userId`);
  }

  const spotifyAccessToken = await getFreshSpotifyToken(userObj);

  if (spotifyAccessToken == null) {
    console.log(`no spotify access token for user ${userId}`);
    return;
  }

  const currentSongData = await getUserCurrentlyPlayingSongData({spotifyAccessToken});
  if (currentSongData == null) {
    console.log(`user ${userId} is not listening to anything`);
    return;
  }

  const {song, artistSpotifyId} = currentSongData;
  console.log(`user ${userId} is listening to ${song.songName} by ${song.artistName}`);

  if (await wasUserAlreadyListeningToSong(userId, song)) {
    console.log(
      `we've already recorded user ${userId} listening to ${song.songName} by ${song.artistName}`
    );
    return
  }

  await recordListen({userId, song});

  if (!(await isAtLeastOneSongIndexedForArtist(song.artistId))) {
    // if we've never indexed any data for this artist, add several top songs (in addition to the
    // currently playing song) to seed
    console.log(`artist ${song.artistName} has no indexed songs, adding top tracks`);
    await Promise.all([
      enqueueSong({
        song,
        spotifyAccessToken,
        includeTopTracksForArtistId: artistSpotifyId,
      }),
      createAddSongToSearchTasks({songs: [song]})
    ]);
  } else if (!(await isSongIndexed(song))) {
    // otherwise, if we haven't indexed the current song, add it (note that the queue's task
    // itself will check again, to ensure atomicity)
    console.log(`artist ${song.artistName} has indexed songs, but not ${song.songName}`);
    await enqueueSong({
      song,
      spotifyAccessToken,
      includeTopTracksForArtistId: null
    });
  } else {
    console.log(`${song.songName} by ${song.artistName} is already indexed`);
  }
};

const assertEnvironmentVariables = () => {
  if (process.env.USER_TABLE_NAME == null) {
    throw new Error("USER_TABLE_NAME is not defined in the environment");
  }

  if (process.env.SONG_TABLE_NAME == null) {
    throw new Error("SONG_TABLE_NAME is not defined in the environment");
  }

  if (process.env.SONG_LISTEN_TABLE_NAME == null) {
    throw new Error("SONG_LISTEN_TABLE_NAME is not defined in the environment");
  }

  if (process.env.PROCESSSONGQUEUE_QUEUE_URL == null) {
    throw new Error("PROCESSSONGQUEUE_QUEUE_URL is not defined in the environment");
  }  
};

const getUserCurrentlyPlayingSongData = async (
  {spotifyAccessToken}: {spotifyAccessToken: string}
) => {
  const sp = getSpotifyClient(spotifyAccessToken);
  const spotifyResponse = await sp.getMyCurrentPlayingTrack();
  const songObj = spotifyResponse.body.item;

  if (songObj == null || !("name" in songObj) || !("artists" in songObj)) {
    return null;
  }

  const songName = songObj.name;
  const artistName = songObj.artists[0].name;

  return {
    song: {
      songName,
      artistName,
      songId: uuidForSong({songName, artistName}),
      artistId: uuidForArtist({artistName}),
    },
    artistSpotifyId: songObj.artists[0].id,
  }  
}

const wasUserAlreadyListeningToSong = async (
  userId: string,
  song: Song,
) => {
  const queryParams = {
    TableName: process.env.SONG_LISTEN_TABLE_NAME,
    Key: {
      userId: {
        "S": userId,
      },
    },
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": {
        "S": userId
      },
    },
    Limit: 1,
    ScanIndexForward: false,
  };
      
  const listens = await dbClient.send(new QueryCommand(queryParams));
  const userHasAtLeastOneListen = listens.Count != null && listens.Count > 0;
  
  return (
    userHasAtLeastOneListen && 
    listens.Items != null &&
    listens.Items[0]["songId"]["S"] === song.songId
  );
}

const recordListen = async ({
  userId,
  song,
} : {
  userId: string,
  song: Song,
}) => {
  const time = Date.now();

  await dbClient.send(new PutItemCommand( {
    TableName: process.env.SONG_LISTEN_TABLE_NAME,
    Item: {
      userId: {
        "S": userId
      },
      "time": {
        "N": time.toString()
      },
      "songId": {
        "S": song.songId
      },
      "expirationTime": {
        "N": (
          Math.floor(time / 1000) + SONG_LISTEN_EXPIRATION_SECONDS
        ).toString()
      }
    },
  }));
}

const isAtLeastOneSongIndexedForArtist = async (artistId: string) => {
  const songsIndexedForArtist = await dbClient.send(new QueryCommand({
    TableName: process.env.SONG_TABLE_NAME,
    KeyConditionExpression: "artistId = :artistId",
    ExpressionAttributeValues: {
      ":artistId": {"S": artistId},
    },
    Limit: 1,
  }));

  return (songsIndexedForArtist.Count || 0) > 0;
}

const isSongIndexed = async (song: Song) => {
  const songItem = await dbClient.send(new GetItemCommand({
    TableName: process.env.SONG_TABLE_NAME,
    Key: {
      "songId": {
        "S": song.songId
      },
      "artistId": {
        "S": song.artistId
      },
    },
  }));
    
  return songItem.Item != null;
}

const enqueueSong = async (
  {song, spotifyAccessToken, includeTopTracksForArtistId}:
  {song: Song, spotifyAccessToken: string, includeTopTracksForArtistId: string | null}
) => {
  const trackNames = new Set([song.songName]);

  if (includeTopTracksForArtistId != null) {
    const sp = getSpotifyClient(spotifyAccessToken);
    const artistTopTracksResponse = await sp.getArtistTopTracks(
      includeTopTracksForArtistId, "US"
    );
    for (const track of artistTopTracksResponse.body.tracks) {
      if (trackNames.size >= MAX_SONGS_PER_ARTIST) {
        break;
      }
      trackNames.add(track.name);
    }
  }
  
  await createAddSongToSearchTasks({songs: Array.from(trackNames).map(
    trackName => (
      {
        songName: trackName,
        artistName: song.artistName,
      })
  )});
}

const createAddSongToSearchTasks = async (
  {songs}: {songs: {songName: string, artistName: string}[]}
) => {
  // Split tracks array into chunks of 10 (SQS's SendMessageBatch limit)
  const trackChunks = Array(Math.ceil(songs.length / 10)).fill(0).map(
    (_, i) => songs.slice(i * 10, i * 10 + 10)
  );

  for (const trackChunk of trackChunks) {
    const entries = trackChunk.map((song, index) => ({
      Id: index.toString(), // must be a unique identifier within the batch
      MessageBody: JSON.stringify({
        songName: song.songName,
        artistName: song.artistName,
      }),
    }));

    const params = {
      QueueUrl: process.env.PROCESSSONGQUEUE_QUEUE_URL,
      Entries: entries,
    };

    try {
      const data = await sqs.send(new SendMessageBatchCommand(params));
      data.Failed?.forEach(failure => {
        console.error("failed to add task to queue", failure);
      });
      data.Successful?.forEach(success => {
        console.log("successfully added task to queue", success);
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err, err.stack);
      }
    }
  }
}
