import {getFreshSpotifyResponse} from "./integrations/spotify/spotify_auth";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { sqs } from "./integrations/aws";
import { Song, SimplifiedSong, SongListen } from "./utility/types";
import { 
  getEnrichedSongs, getTopArtistsForUser, getTopSongsForArtist, getUserRecentlyPlayedSongs,
} from "./integrations/spotify/spotify_data";
import { getFirestoreDb } from "./integrations/firebase";
import { DocumentData } from "firebase-admin/firestore";
import { createRefreshUserTask } from "./refresh_user";
import stringSimilarity from "string-similarity-js";

// *** CONSTANTS ***
// when we've never indexed any data for an artist, we add several top tracks (in addition to the
// currently playing song) to seed
const MAX_SONGS_PER_ARTIST = 5;

// *** PUBLIC INTERFACE ***
// for each user in the database that matches our "minute" seed, we run processOneUser
export const processUsers = async ({minute}: {minute: number}) => {
  if (minute == null || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error(`invalid minute: ${minute}`);
  }

  // make sure we have all the environment variables we need
  assertEnvironmentVariables();

  const db = await getFirestoreDb();
  const users = await db.collection("users").where("seed", "==", minute).get();

  const errors: unknown[] = [];

  // avoid parallelizing for now, to avoid hitting spotify rate limits
  for (const d of users.docs) {
    try {
      await processOneUser({userId: d.ref.id, userData: d.data()})
    } catch (err) {
      if (err instanceof Error) {
        errors.push({
          message: err.message,
          stacktrace: err.stack,
        });
      } else {
        errors.push(err);
      }
    }
  }

  if (errors.length > 0) {
    throw Error(
      "some usesr were not processed correctly: " +
      JSON.stringify(errors)
    );
  }
}

// add some data to db and to search depending on the user's recent listening activity
// - first we check if the user has listened to songs since we last checked; if so, we record
//    the listens
// - then for each song that our system hasn't seen before, we add that song to the processing
//     queue 
// - we also add the each song's artist's top tracks to the processing queue if we haven't seen the 
//    artist before
export const processOneUser = async (
  {userId, userData, includeTopArtists = false}:
  {userId: string, userData: DocumentData, includeTopArtists?: boolean}
) => {  
  console.log(`processing user ${userId}`);

  const spotifyResponse = await getFreshSpotifyResponse(userData);

  if (spotifyResponse == null) {
    console.log(`no spotify access token for user ${userId}`);
    return;
  }

  if (spotifyResponse.status !== 200) {
    throw new Error(
      `error getting spotify access token for user ${userId}: ${JSON.stringify(spotifyResponse)}`
    );
  }

  const {access_token: spotifyAccessToken} = spotifyResponse.data;

  const lastCheckedRecentPlaysAt = userData.lastCheckedRecentPlaysAt;

  if (lastCheckedRecentPlaysAt == null) {
    console.log(`user ${userId} has no lastCheckedRecentPlaysAt`);
  } else {
    console.log(`user ${userId} lastCheckedRecentPlaysAt: ${lastCheckedRecentPlaysAt}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const recentListens = await getUserRecentlyPlayedSongs({
    spotifyAccessToken,
    lastCheckedRecentPlaysAt,
  });

  const newLastCheckedRecentPlaysAt = (
    recentListens.length > 0 ? Math.max(...recentListens.map((l) => l.metadata.playedAt)) :
      Date.now()
  );

  await updateLastCheckedRecentPlaysAt({
    userId, lastCheckedRecentPlaysAt: newLastCheckedRecentPlaysAt
  });

  if (recentListens.length === 0) {
    console.log(`user ${userId} has not listening to anything since we last checked`);
    return;
  }

  const topArtists = includeTopArtists ? await getTopArtistsForUser({spotifyAccessToken}) : [];

  const allArtistIds = Array.from(new Set([
    ...recentListens.map((l) => l.song.primaryArtist.id),
    ...topArtists.map((a) => a.id),
  ]));
  const allArtists = [];
  for (const artistId of allArtistIds) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const recentListen = recentListens.find((l) => l.song.primaryArtist.id === artistId)!;
    allArtists.push(recentListen.song.primaryArtist);
  }
  const allSongIds = Array.from(new Set(recentListens.map((l) => l.song.id)));

  console.log(
    // eslint-disable-next-line max-len
    `user ${userId} has ${recentListens.length} recent listens - ${allSongIds.length} songs by ${allArtistIds.length} artists`
  );

  // note that the db that these values are read from is updated by processSong - we don't
  // care about making it transactional because the worst case is that we run processSong on
  // a song that's already been processed, in which case it will just return early
  const [indexedArtistIds, indexedSongInfos]  = await Promise.all([
    getIndexedArtistIds(allArtistIds),
    getIndexedSongInfo(allSongIds)
  ]);
  const indexedSongIds = indexedSongInfos.map((s) => s.songId);

  console.log(
    `${indexedArtistIds.length} artists and ${indexedSongIds.length} songs are already indexed`
  );

  // filter out recent listens for songs without lyrics
  const recentListensToRecord = recentListens.filter((l) => {
    const songInfo = indexedSongInfos.find((s) => s.songId === l.song.id);
    return songInfo == null || !songInfo.isMissingLyrics;
  });

  if (recentListensToRecord.length !== 0) {
    console.log(`recording ${recentListensToRecord.length} recent listens`);
    await recordListens({userId, listens: recentListensToRecord});
  } else {
    console.log("no recent listens to record");
  }

  // get top songs for artists that we haven't indexed any songs for, in order to seed data
  const artistsWithoutIndexedSongs = allArtists.filter(
    (a) => !indexedArtistIds.includes(a.id)
  );
  console.log(`getting top songs for ${artistsWithoutIndexedSongs.length} artists`);

  const topSongsForArtists = (await Promise.all(
    artistsWithoutIndexedSongs.map((artist) => getTopSongsForArtist({
      artistSpotifyId: artist.spotifyId,
      spotifyAccessToken,
    }))
  ));

  const songsToProcess = await getSongsToProcess({
    indexedSongIds,
    recentListens: recentListensToRecord,
    topSongsForArtists: topSongsForArtists.flat()
  });

  const enrichedSongsToProcess = await getEnrichedSongs({
    spotifyAccessToken,
    simplifiedSongs: songsToProcess,
  });

  await createProcessSongTasks({songs: enrichedSongsToProcess});

  const db = await getFirestoreDb();
  const userRecommendations = (
    await db.collection("user-recommendations").doc(userId).get()
  ).data();

  const lastRefreshedAt = userRecommendations?.lastRefreshedAt;
  if (lastRefreshedAt != null) {

    // if we haven't refreshed recommendations in the last ~24 hours, do so
    if (Date.now() - lastRefreshedAt > 1000 * 60 * 60 * 23.5) {
      await createRefreshUserTask({
        userId,

        // add a delay so that ideally some of the songs we just added to the queue will be
        // processed before we refresh recommendations
        delaySeconds: 5 * 60,
      })
    }
  }
}

// *** PRIVATE HELPERS ***
const assertEnvironmentVariables = () => {
  if (process.env.PROCESSSONGQUEUE_QUEUE_URL == null) {
    throw new Error("PROCESSSONGQUEUE_QUEUE_URL is not defined in the environment");
  }  
};

const updateLastCheckedRecentPlaysAt = async (
  {userId, lastCheckedRecentPlaysAt}: {userId: string, lastCheckedRecentPlaysAt: number}
) => {
  const db = await getFirestoreDb();

  db.collection("users").doc(userId).update({
    lastCheckedRecentPlaysAt
  });
}

const getIndexedArtistIds = async (artistIds: string[]) => {
  const db = await getFirestoreDb();

  const artistsIndexed = await db.collection("artists").where(
    "artistId", "in", artistIds
  ).get();

  return artistsIndexed.docs.map((d) => d.data().artistId);
}

const getIndexedSongInfo = async (songIds: string[]) => {
  const db = await getFirestoreDb();

  const songsIndexed = await db.collection("songs").where(
    "songId", "in", songIds
  ).get();

  return songsIndexed.docs.map((d) =>  {
    return {
      songId: d.data().songId,
      isMissingLyrics: d.data().isMissingLyrics
    }
  });
}

const recordListens = async ({
  userId,
  listens,
} : {
  userId: string,
  listens: SongListen[],
}) => {
  if (listens.length === 0) {
    return;
  }

  const db = await getFirestoreDb();

  const listenObjs = listens.map((l) => {
    return {
      userId,
      songId: l.song.id,
      artistId: l.song.primaryArtist.id,
      time: l.metadata.playedAt,
      context: l.metadata.playedFrom || "unknown",
    }
  })

  await db.runTransaction(async (transaction) => {
    const user = await transaction.get(db.collection("user-recent-listens").doc(userId));
    const today = user.data()?.today || {};
    const newToday = {
      songs: [...listenObjs.map((l) => l.songId), ...(today.songs || [])],
      artists: [...listenObjs.map((l) => l.artistId), ...(today.artists || [])]
    }
    // we're not using ArrayUnion because it doesn't allow duplicates
    transaction.set(db.collection("user-recent-listens").doc(userId), {
      today: newToday,
    },
    {
      merge: true,
    }
    );
    listenObjs.forEach((listen) => {
      transaction.create(db.collection("recent-listens").doc(), listen);
    });
  });
}

const getSongsToProcess = async (
  {indexedSongIds, recentListens, topSongsForArtists}:
    {indexedSongIds: string[], recentListens: SongListen[], topSongsForArtists: SimplifiedSong[]}
) => {
  // helper variables to prevent duplicates and respect limits
  const songIdsInList: Set<string> = new Set([]);
  const songNamesForArtists: {[key: string]: string[]} = {};
  
  // actual list of songs we will be processing
  const songsToProcess: SimplifiedSong[] = [];
  
  // overall we should definitely process any unindexed song that actually has a listen;
  // for top artist songs, we should process any song that doesn't take us over the limit
  const maybeAddSong = (
    {song, isFromTopSongsForArtists}:
      {song: SimplifiedSong, isFromTopSongsForArtists: boolean}
  ) => {
    const songNamesForArtist = songNamesForArtists[song.primaryArtist.id] || [];
  
    // don't add songs that we've already added
    if (songIdsInList.has(song.id)) {
      return;
    }
  
    // don't add songs that we've already indexed
    if (indexedSongIds.includes(song.id)) {
      return;
    }

    // probably a remix or alternative version of a song we already added
    if (songNamesForArtist.some((name) => stringSimilarity(
      name, song.name
    ) > 0.3)) {
      return;
    }
  
    // don't add songs from top songs for artists that would take us over the limit
    if (isFromTopSongsForArtists && songNamesForArtist.length >= MAX_SONGS_PER_ARTIST ) {
      return;
    }
  
    // update helpers
    songIdsInList.add(song.id);
    songNamesForArtist.push(song.name);
    songNamesForArtists[song.primaryArtist.id] = songNamesForArtist;
  
    // update canonical list
    songsToProcess.push(song);
  }
  
  recentListens.map((l) => maybeAddSong({song: l.song, isFromTopSongsForArtists: false}));
  topSongsForArtists.map(
    (s) => maybeAddSong({song: s, isFromTopSongsForArtists: true})
  );

  return songsToProcess;
}

const createProcessSongTasks = async (
  {songs}: {songs: Song[]}
) => {
  // Split tracks array into chunks of 10 (SQS's SendMessageBatch limit)
  const trackChunks = Array(Math.ceil(songs.length / 10)).fill(0).map(
    (_, i) => songs.slice(i * 10, i * 10 + 10)
  );

  for (const trackChunk of trackChunks) {
    const entries = trackChunk.map((s, index) => ({
      Id: index.toString(), // must be a unique identifier within the batch
      MessageBody: JSON.stringify(s),
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
