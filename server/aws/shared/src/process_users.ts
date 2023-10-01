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
import _ from "lodash";

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

  // if the user is new, we will process their top tracks and tracks by their top artists, to
  // make sure we have enough data to make good recs
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

    // act as if the user has listened to each top track more than once, since presumably the
    // user actually did - the effect will be to give the user's favorite tracks bigger frequency
    // boosts and make stats a bit more accurate
    additionalListens = [
      ...stretchTopSongsArray({songs: tt[0]}).map((t) => ({
        song: t,
        metadata: {
          // two weeks ago
          playedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
          playedFrom: "unknown",
        }
      })),
      ...stretchTopSongsArray({songs: tt[1]}).map((t) => ({
        song: t,
        metadata: {
          // three months ago
          playedAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
          playedFrom: "unknown",
        }
      })),
      ...stretchTopSongsArray({songs: tt[2]}).map((t) => ({
        song: t,
        metadata: {
          // one year ago
          playedAt: Date.now() - 1000 * 60 * 60 * 24 * 365,
          playedFrom: "unknown",
        }
      })),
    ]
  }


  if (recentListens.length === 0 
    && additionalListens.length === 0
    && additionalArtists.length === 0
  ) {
    console.log(`user ${userId} has not listened to anything since we last checked`);
    return;
  }

  // do not include artists from additionalListens, since we already have plenty of artists to
  // include for new users between recent listens artists and top artists
  const candidateArtistIds = new Set<string>();
  const candidateArtists = [];
  for (const artist of [
    // prioritize "additional" (top) artists, since we can produce recommendations more relevant to
    // the user with these (we are going to slice off the end of this array below, so the order
    // matters)
    ...additionalArtists,
    ...recentListens.map((rl) => rl.song.primaryArtist)
  ]) {
    if (!candidateArtistIds.has(artist.id)) {
      candidateArtists.push(artist);
      candidateArtistIds.add(artist.id);
    }
  }

  console.log(
    `user ${userId} has ${candidateArtists.length} candidate artists`
  );

  // figure out which artists have already been fully indexed
  const indexedArtistIds = await getIndexedArtistIds(new Array(...candidateArtistIds));

  console.log(`${indexedArtistIds.length} artists are already indexed`);

  // get top songs for artists that we haven't indexed any songs for, in order to seed data
  const artistsWithoutEnoughIndexedSongs = candidateArtists.filter(
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
  
  // if an artist does not have enough songs to ever be considered fully indexed, mark them as
  // such in the db
  topSongsForArtists.forEach((topSongs, index) => {
    const artist = artistsWithoutEnoughIndexedSongs[index];
    if (topSongs.length < MAX_SONGS_PER_ARTIST) {
      db.collection("artists").doc(artist.id).set({
        artistId: artist.id,
        artistName: artist.name,
        hasInsufficientTopSongs: true,
      }, {merge: true})   
    }
  });

  const topSongsForArtistsFlat = topSongsForArtists.flat();

  // now we have all the songs that we might process: recent listens, top songs, and songs from top
  // artists
  const allSongIds = Array.from(
    new Set([
      ...recentListens.map((l) => l.song.id),
      ...additionalListens.map((l) => l.song.id),
      ...topSongsForArtistsFlat.map((s) => s.id),
    ])
  );

  console.log(
    // eslint-disable-next-line max-len
    `user ${userId} has ${recentListens.length} recent listens, ${additionalListens.length} additional listens, and ${topSongsForArtistsFlat.length} top artist tracks - ${allSongIds.length} unique songs`
  );

  // note that the collection that these values are read from is updated later by processSong - we
  // don't care about making it transactional because the worst case is that we run processSong on
  // a song that's already been processed, in which case it will just return early
  const indexedSongInfos = await getIndexedSongInfo(allSongIds)
  const indexedSongIds = indexedSongInfos.map((s) => s.songId);

  console.log(
    `${indexedSongIds.length} songs are already indexed`
  );

  // filter out listens for songs without lyrics - we don't even want to log these since they add
  // noise to the user's data
  const listensToRecord = [...recentListens, ...additionalListens].filter((l) => {
    const songInfo = indexedSongInfos.find((s) => s.songId === l.song.id);
    return songInfo == null || !songInfo.isMissingLyrics;
  })

  if (listensToRecord.length === 0) {
    console.log("no listens to record");
  } else {
    console.log(`recording ${listensToRecord.length} listens`);
    await recordListens({userId, listens: listensToRecord});
  }

  const songsToProcess = await getSongsToProcess({
    indexedSongIds,
    listens: listensToRecord,
    topSongsForArtists: topSongsForArtistsFlat,
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

  // consider an artist indexed if they have at least N songs indexed or if we've already
  // marked them as having insufficient top songs
  return artistsIndexed
    .filter(d => (d.numIndexedSongs ?? 0) > MAX_SONGS_PER_ARTIST || d.hasInsufficientTopSongs)
    .map((d) => d.artistId);
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
  listens,
} : {
  userId: string,
  listens: SongListen[],
}) => {
  if (listens.length === 0) {
    return;
  }

  const db = await getFirestoreDb();

  await db.runTransaction(async (transaction) => {
    const user = await transaction.get(db.collection("user-recent-listens").doc(userId));
    
    const newData = _.cloneDeep(user.data() || {});

    listens.forEach(l => {
      const period = getListenPeriod(l);
      if (!(period in newData)) {
        newData[period] = {
          songs: [],
          artists: [],
        }
      }
      newData[period].songs.push(l.song.id);
      newData[period].artists.push(l.song.primaryArtist.id);
    })

    // we're not using ArrayUnion because it doesn't allow duplicates
    transaction.set(db.collection("user-recent-listens").doc(userId), newData)

    const listenObjs = listens.map((l) => {
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

const getListenPeriod = (listen: SongListen) => {
  const daysAgo = (Date.now() - listen.metadata.playedAt) / (1000 * 60 * 60 * 24);
  if (daysAgo < 1) {
    return "today";
  } else if (daysAgo < 2) {
    return "yesterday";
  } else if (daysAgo < 9) {
    return `daysAgo-${Math.floor(daysAgo)}`;
  } else {
    return "longerAgo";
  }
}

// add repeats since presumably the user listened to these songs more than once
// if the array is the maximum size (50) it will be stretched out to a length of 120
const stretchTopSongsArray = ({songs}: {songs: SimplifiedSong[]}) => {
  return [
    ...stretchTopSongsSubArray({songs: songs.slice(0, 5), factor: 5}),
    ...stretchTopSongsSubArray({songs: songs.slice(5, 10), factor: 4}),
    ...stretchTopSongsSubArray({songs: songs.slice(10, 20), factor: 3}),
    ...stretchTopSongsSubArray({songs: songs.slice(20, 35), factor: 2}),
    ...stretchTopSongsSubArray({songs: songs.slice(35), factor: 1}),
  ]
}

const stretchTopSongsSubArray = ({songs, factor}: {songs: SimplifiedSong[], factor: number}) => {
  let result: SimplifiedSong[] = [];
  for (let i = 0; i < factor; i++) {
    result = result.concat(songs);
  }
  return result;
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
