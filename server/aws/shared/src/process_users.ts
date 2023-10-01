import {getFreshSpotifyResponse} from "./integrations/spotify/spotify_auth";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { sqs } from "./integrations/aws";
import { Song, SimplifiedSong, SongListen, Artist } from "./utility/types";
import { 
  getEnrichedSongs, getTopArtistsForUser, getTopSongsForArtist,
  getTopTracksForUser, getUserRecentlyPlayedSongs,
} from "./integrations/spotify/spotify_data";
import { getFirestoreDb } from "./integrations/firebase";
import { DocumentData } from "firebase-admin/firestore";
import { createRefreshUserTask } from "./refresh_user";
import stringSimilarity from "string-similarity-js";

// *** CONSTANTS ***
// when we've never indexed any data for an artist, we add several top tracks (in addition to the
// currently playing song) to seed
const MAX_SONGS_PER_ARTIST = 5;

// it's unclear exactly what Spotify's rate limit is, but we'll be conservative here - we can't
// batch requests to the getArtistTopTracks endpoint, so these calls end up counting a lot against
// our rate limit
const MAX_ARTISTS_PER_RUN = 25;

// *** PUBLIC INTERFACE ***
// for each user in the database that matches our "minute" seed, we run processOneUser
export const processUsers = async ({minute}: {minute: number}) => {
  if (minute == null || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error(`invalid minute: ${minute}`);
  }

  // make sure we have all the environment variables we need
  assertEnvironmentVariables();

  const db = await getFirestoreDb();

  const newUsers = await db.collection("users")
    .where("seed", "==", null)
    .where("spotifyAccessToken", "!=", null).get();

  await Promise.all(newUsers.docs.map((d) => {
    db.collection("users").doc(d.ref.id).set({
      seed: minute,
    }, {merge: true})
  }));

  const existingUsers = await db.collection("users").where("seed", "==", minute).get();

  const errors: unknown[] = [];

  // avoid parallelizing for now, to avoid hitting spotify rate limits
  for (const {d, isNew} of [
    ...existingUsers.docs.map((d) => ({d, isNew: false})),
    ...newUsers.docs.map((d) => ({d, isNew: true}))
  ]) {
    try {
      await processOneUser({userId: d.ref.id, userData: d.data(), isNew})
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
// - if includeTopContent is true, we also add the user's top tracks and tracks from their top
//    artists to the processing queue
const processOneUser = async (
  {userId, userData, isNew}:
  {userId: string, userData: DocumentData, isNew: boolean}
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

  let additionalArtists: Artist[] = [];
  let additionalListens: SongListen[] = [];
  if (isNew) {
    const [ta, ...tt] = await Promise.all([
      getTopArtistsForUser({spotifyAccessToken}),
      getTopTracksForUser({spotifyAccessToken, time_range: "short_term"}),
      getTopTracksForUser({spotifyAccessToken, time_range: "medium_term"}),
      getTopTracksForUser({spotifyAccessToken, time_range: "long_term"}),
    ]);

    additionalArtists = ta;

    // act as if the user has listened to each short term top track once, each medium term top
    // track twice, and each long term top track three times
    additionalListens = [
      ...tt[0].map((t) => ({
        song: t,
        metadata: {
          // two weeks ago
          playedAt: Date.now() - 1000 * 60 * 60 * 24 * 2 * 7,
          playedFrom: "unknown",
        }
      })),
      ...[...tt[1], ...tt[1]].map((t) => ({
        song: t,
        metadata: {
          // three months ago
          playedAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
          playedFrom: "unknown",
        }
      })),
      ...[...tt[2], ...tt[2], ...tt[2]].map((t) => ({
        song: t,
        metadata: {
          // one year ago
          playedAt: Date.now() - 1000 * 60 * 60 * 24 * 365,
          playedFrom: "unknown",
        }
      })),
    ]
  }

  // do not include artists from additionalListens, since we already have plenty of artists to
  // include for new users between recent listens artists and top artists
  const allArtistIds = Array.from(new Set([
    ...recentListens.map((l) => l.song.primaryArtist.id),
    ...additionalArtists.map((a) => a.id),
  ]));
  const allArtists = [];
  for (const artistId of allArtistIds) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const recentListen = recentListens.find((l) => l.song.primaryArtist.id === artistId)!;
    allArtists.push(recentListen.song.primaryArtist);
  }
  const allSongIds = Array.from(
    new Set([...recentListens.map((l) => l.song.id), ...additionalListens.map((l) => l.song.id)])
  );

  console.log(
    // eslint-disable-next-line max-len
    `user ${userId} has ${recentListens.length} recent listens - ${allSongIds.length} songs by ${allArtistIds.length} artists`
  );

  // note that the db that these values are read from is updated by processSong - we don't
  // care about making it transactional because the worst case is that we run processSong on
  // a song that's already been processed, in which case it will just return early
  const [indexedArtistIds, indexedSongInfos] = await Promise.all([
    getIndexedArtistIds(allArtistIds),
    getIndexedSongInfo(allSongIds)
  ]);
  const indexedSongIds = indexedSongInfos.map((s) => s.songId);

  console.log(
    `${indexedArtistIds.length} artists and ${indexedSongIds.length} songs are already indexed`
  );

  // filter out listens for songs without lyrics
  const [
    recentListensToRecord, additionalListensToRecord
  ] = [
    recentListens, additionalListens
  ].map(array => array.filter((l) => {
    const songInfo = indexedSongInfos.find((s) => s.songId === l.song.id);
    return songInfo == null || !songInfo.isMissingLyrics;
  }));

  if (recentListensToRecord.length !== 0 || additionalListensToRecord.length !== 0) {
    console.log(
      // eslint-disable-next-line max-len
      `recording ${recentListensToRecord.length} recent listens` + additionalListensToRecord.length && ` and ${additionalListensToRecord.length} additional listens`
    );
    await recordListens(
      {userId, recentListens: recentListensToRecord, additionalListens: additionalListensToRecord}
    );
  } else {
    console.log("no listens to record");
  }

  // get top songs for artists that we haven't indexed any songs for, in order to seed data
  const artistsWithoutEnoughIndexedSongs = allArtists.filter(
    (a) => !indexedArtistIds.includes(a.id)
  );
  console.log(`getting top songs for ${artistsWithoutEnoughIndexedSongs.length} artists`);

  const topSongsForArtists = (await Promise.all(
    artistsWithoutEnoughIndexedSongs
      .slice(0, MAX_ARTISTS_PER_RUN)
      .map((artist) => getTopSongsForArtist({
        artistSpotifyId: artist.spotifyId,
        spotifyAccessToken,
      }))
  ));

  const songsToProcess = await getSongsToProcess({
    indexedSongIds,
    listens: [...recentListensToRecord, ...additionalListensToRecord],
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
  // if we haven't refreshed recommendations in the last ~24 hours, do so
  if (lastRefreshedAt == null || Date.now() - lastRefreshedAt > 1000 * 60 * 60 * 23.5) {
    await createRefreshUserTask({
      userId,
      numRetries: isNew ? 5 : 0,
      alwaysFeatureVeryTopArtist: isNew,

      // add a delay so that ideally some of the songs we just added to the queue will be
      // processed before we refresh recommendations
      delaySeconds: 5 * 60,
    })
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

const getInChunks = async (
  {ids, collection, fieldName}: {ids: string[], collection: string, fieldName: string}
) => {
  const db = await getFirestoreDb();

  const chunkSize = 30;
  const docs: DocumentData[] = [];
  
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const querySnapshot = await db.collection(collection).where(fieldName, "in", chunk).get();

    querySnapshot.forEach((doc) => {
      docs.push(doc.data());
    });
  }

  return docs;
}

const getIndexedArtistIds = async (artistIds: string[]): Promise<string[]> => {
  const artistsIndexed = await getInChunks({
    ids: artistIds, collection: "artists", fieldName: "artistId",
  })

  // consider an artist indexed if they have at least 3 songs indexed
  return artistsIndexed.filter(
    d => (d.numIndexedSongs ?? 0) > 3).map((d) => d.artistId
  );
}

const getIndexedSongInfo = async (songIds: string[]) => {
  const songsIndexed = await getInChunks({
    ids: songIds, collection: "songs", fieldName: "songId",
  })

  return songsIndexed.map((d) =>  {
    return {
      songId: d.songId,
      isMissingLyrics: d.isMissingLyrics
    }
  });
}

const recordListens = async ({
  userId,
  recentListens,
  additionalListens,
} : {
  userId: string,
  recentListens: SongListen[],
  additionalListens: SongListen[],
}) => {
  if (recentListens.length === 0 && additionalListens.length === 0) {
    return;
  }

  const db = await getFirestoreDb();

  await db.runTransaction(async (transaction) => {
    const user = await transaction.get(db.collection("user-recent-listens").doc(userId));
    const today = user.data()?.today || {};
    const longerAgo = user.data()?.longerAgo || {};
    const newToday = {
      songs: [...recentListens.map((l) => l.song.id), ...(today.songs || [])],
      artists: [...recentListens.map((l) => l.song.primaryArtist.id), ...(today.artists || [])]
    }
    const newLongerAgo = {
      songs: [...additionalListens.map((l) => l.song.id), ...(longerAgo.songs || [])],
      artists: [
        ...additionalListens.map((l) => l.song.primaryArtist.id),
        ...(longerAgo.artists || [])
      ]
    }

    // we're not using ArrayUnion because it doesn't allow duplicates
    transaction.set(db.collection("user-recent-listens").doc(userId), {
      today: newToday,
      longerAgo: newLongerAgo,
    },
    {
      merge: true,
    }
    );

    const listenObjs = [...recentListens, ...additionalListens].map((l) => {
      return {
        userId,
        songId: l.song.id,
        artistId: l.song.primaryArtist.id,
        time: l.metadata.playedAt,
        context: l.metadata.playedFrom || "unknown",
      }
    })

    listenObjs.forEach((listen) => {
      transaction.create(db.collection("recent-listens").doc(), listen);
    });
  });
}

const getSongsToProcess = async (
  {indexedSongIds, listens, topSongsForArtists}:
    {indexedSongIds: string[], listens: SongListen[], topSongsForArtists: SimplifiedSong[]}
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
  
  listens.map((l) => maybeAddSong({song: l.song, isFromTopSongsForArtists: false}));
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
