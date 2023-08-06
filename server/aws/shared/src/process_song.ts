import {getLyrics} from "./integrations/genius";
import {labelPassages, vectorizePassages} from "./integrations/open_ai/open_ai_integration";
import {getSearchClient} from "./integrations/aws";
import {uuidForPassage} from "./utility/uuid";
import {LabeledPassage, Song, VectorizedAndLabeledPassage} from "./utility/types";
import { getFirestoreDb } from "./integrations/firebase";
import {FieldValue} from "firebase-admin/firestore";

// *** PUBLIC INTERFACE ***
// takes as input a song name and artist name and processes the song:
// - adds the song to db (function returns early here if the song has already been added)
// - gets the lyrics from genius
// - uses openai to pick the best passages and analyze sentiments
// - adds the song to the search index
// - updates the song in db with the sentiments
export const processSong = async (song: Song) => {
  // make sure we have all the environment variables we need
  assertEnvironmentVariables();

  // the song was already added to the db so we assume that another lambda
  // is already processing it
  if (!(await addSongToDb(song))) {
    return;
  }

  // lyrics from genius integration
  const getLyricsResponse = await getLyrics({song});

  if (getLyricsResponse.outcome === "failure") {
    console.log(
      // eslint-disable-next-line max-len
      `no lyrics found for song (${getLyricsResponse.reason}): ${song.primaryArtist.name}: ${song.name}`
    )
    await markLyricsAsMissing({song, reason: getLyricsResponse.reason});
    return;
  }

  const {lyrics} = getLyricsResponse;

  console.log(`got lyrics for song: ${JSON.stringify(
    {
      song: `${song.primaryArtist.name}: ${song.name}`,
      lyrics,
    }
  )}`);

  // analysis from openai integration
  const {
    sentiments: songSentiments, passages, metadata: labelingMetadata
  } = await labelPassages({lyrics});

  console.log(`got analysis for song: ${JSON.stringify(
    {
      song,
      songSentiments,
      passages,
    }
  )}`);

  const vectorizedPassages = await vectorizePassages({labeledPassages: passages});

  console.log(`got vectorized passages for song ${song.name} by ${song.primaryArtist.name}`);

  await addSongToSearch(
    song,
    {
      songSentiments,
      songLyrics: lyrics,
      unvectorizedPassages: passages,
      vectorizedPassages,
      labelingMetadata
    }
  );
  console.log(`added song ${song.primaryArtist.name}: ${song.name} to search`);

  await updateSentimentsForSong(song, songSentiments);
  console.log(`updated song ${song.primaryArtist.name}: ${song.name} with sentiments in db`);
};

// *** PRIVATE HELPERS ***
const assertEnvironmentVariables = () => {
  if (process.env.OPENSEARCH_URL == null) {
    throw new Error("OPENSEARCH_URL is not defined in the environment");
  }
}

const addSongToDb = async (
  song: Song
): Promise<boolean>=> {
  const db = await getFirestoreDb();
  const songDocRef = db.collection("songs").doc(song.id)

  return await db.runTransaction(async (transaction) => {
    const songDoc = await transaction.get(songDocRef);

    if (songDoc.exists) {
      console.log(`song ${song.primaryArtist.name}: ${song.name} already exists in db`)
      return false;
    }

    transaction.set(songDocRef, {
      songId: song.id,
      artistId: song.primaryArtist.id,
      songName: song.name,
      artistName: song.primaryArtist.name,
    });

    transaction.set(db.collection("artists").doc(song.primaryArtist.id), {
      artistId: song.primaryArtist.id,
      artistName: song.primaryArtist.name,
    });

    console.log(`added song ${song.primaryArtist.name}: ${song.name} to db`)
    return true;
  });
}


// if we discover that a song's lyrics are missing from genius, we:
// - mark the song as missing lyrics
// - delete any existing song listens, as these are no longer relevant for our purposes
const markLyricsAsMissing = async (
  {song, reason} : {song: Song, reason: string}
) => {
  const db = await getFirestoreDb();
  await db.runTransaction(async (transaction) => {
    // get all the song listens for the song
    const songListenSnaps = await transaction.get(db.collection("recent-listens").where(
      "songId", "==", song.id
    ));

    const affectedUsers = songListenSnaps.docs.map((doc) => doc.data().userId);

    // mark the lyrics as missing for the song
    transaction.update(db.collection("songs").doc(song.id), {
      lyricsMissingReason: reason,
    })

    // delete all the song listens
    songListenSnaps.forEach((doc) => {
      transaction.delete(doc.ref);
    });

    // remove the song listen for each affected user
    affectedUsers.forEach((userId) => {
      const docRef = db.collection("user-recent-listens").doc(userId);
      transaction.update(docRef, {
        "today.songs": FieldValue.arrayRemove(song.id),
      });
    });
  });
}

const addSongToSearch = async (
  song: Song,
  {
    songSentiments,
    songLyrics,
    unvectorizedPassages,
    vectorizedPassages,
    labelingMetadata,
  } :
  {
    songSentiments: string[],
    songLyrics: string,
    unvectorizedPassages: LabeledPassage[],
    vectorizedPassages: VectorizedAndLabeledPassage[],
    labelingMetadata: {
      labeledBy: string,
    }
  }
) => {
  const {id: songId, ...songRest} = song;
  const searchClient = getSearchClient();

  await Promise.all([...vectorizedPassages.map((passage) => searchClient.index({
    id: uuidForPassage({
      lyrics: passage.lyrics,
      songName: song.name,
      artistName: song.primaryArtist.name,
    }),
    index: "song-lyric-passages",
    body: {
      ...passage,
      metadata: {
        ...passage.metadata,
        ...labelingMetadata,
        indexTime: Date.now(),
      },
      primarySentiment: passage.sentiments[0],
      song: {
        ...song,
        lyrics: songLyrics,
        sentiments: songSentiments,
      },
    },
  })),
  searchClient.index({
    id: songId,
    index: "song-lyric-songs",
    body: {
      ...songRest,
      lyrics: songLyrics,
      sentiments: songSentiments,
      passageSentiments: Array.from(
        new Set(unvectorizedPassages.map((passage) => passage.sentiments).flat())
      ),
      passages: unvectorizedPassages.map((passage) => {
        return {
          id: uuidForPassage({
            lyrics: passage.lyrics,
            songName: song.name,
            artistName: song.primaryArtist.name,
          }),
          ...passage,
        }
      }),
      metadata: {
        ...labelingMetadata,
        indexTime: Date.now(),
      },
    }
  })]);
}

const updateSentimentsForSong = async (
  song: Song,
  sentiments: string[],
) => {
  const db = await getFirestoreDb();
  await db.collection("songs").doc(song.id).update({
    sentiments,
  });
}