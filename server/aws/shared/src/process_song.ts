import {getLyrics} from "./integrations/genius";
import {
  getArtistEmoji, labelPassages, vectorizePassages
} from "./integrations/open_ai/open_ai_integration";
import {getSearchClient} from "./integrations/aws";
import {uuidForPassage} from "./utility/uuid";
import {LabeledPassage, Song, VectorizedAndLabeledPassage} from "./utility/types";
import { getFirestoreDb } from "./integrations/firebase";
import {FieldValue} from "firebase-admin/firestore";
import { getImageColors } from "./utility/image";
import { FinalColor } from "extract-colors/lib/types/Color";

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

  if (song.album.image.url == null) {
    console.log(
      `no image found for song: ${song.primaryArtist.name}: ${song.name}`
    )
    await markSongAsNotIndexed({song, reason: "no_image"});
    return;
  }

  // lyrics from genius integration
  const getLyricsResponse = await getLyrics({song});

  if (getLyricsResponse.outcome === "failure") {
    console.log(
      // eslint-disable-next-line max-len
      `no lyrics found for song (${getLyricsResponse.reason}): ${song.primaryArtist.name}: ${song.name}`
    )
    await markSongAsNotIndexed({song, reason: getLyricsResponse.reason});
    return;
  }

  const {lyrics} = getLyricsResponse;

  console.log(`got lyrics for song: ${JSON.stringify(
    {
      song: `${song.primaryArtist.name}: ${song.name}`,
      lyrics,
    }
  )}`);

  // get analysis from openai integration and image colors in parallel
  const [{
    sentiments: songSentiments, passages, metadata: labelingMetadata
  }, colors] = await Promise.all([
    labelPassages({lyrics}),
    getImageColors({url: song.album.image.url})
  ]);

  if (passages.length === 0) {
    console.log(
      `no passages found for song: ${song.primaryArtist.name}: ${song.name}`
    )
    await markSongAsNotIndexed({song, reason: "no_passages"});
    return;
  }

  if (colors == null) {
    console.log(
      `no colors found for song: ${song.primaryArtist.name}: ${song.name}`
    )
    await markSongAsNotIndexed({song, reason: "no_colors"});
    return;
  }

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
      albumColors: colors,
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

// adds the song with basic metadata to the db
const addSongToDb = async (
  song: Song
): Promise<boolean>=> {
  const db = await getFirestoreDb();
  const songDocRef = db.collection("songs").doc(song.id);
  const artistDocRef = db.collection("artists").doc(song.id);

  const result = await db.runTransaction(async (transaction) => {
    const [songDoc, artistDoc] = await transaction.getAll(songDocRef, artistDocRef);

    if (songDoc.exists) {
      console.log(`song ${song.primaryArtist.name}: ${song.name} already exists in db`)
      return {
        songAdded: false,
        artistAdded: false,
      };
    }

    transaction.set(songDocRef, {
      songId: song.id,
      artistId: song.primaryArtist.id,
      songName: song.name,
      artistName: song.primaryArtist.name,
    });

    const artistData = artistDoc.data();
    transaction.set(artistDocRef, {
      artistId: song.primaryArtist.id,
      artistName: song.primaryArtist.name,
      numIndexedSongs: artistData ? artistData.numIndexedSongs + 1 : 1,
    });

    console.log(`added song ${song.primaryArtist.name}: ${song.name} to db`)
    return {
      songAdded: true,
      artistAdded: !artistDoc.exists,
    };
  });

  if (result.artistAdded) {
    const artistEmoji = getArtistEmoji({artistName: song.primaryArtist.name})
    await artistDocRef.update({artistEmoji})
  }

  return result.songAdded;
}


// if we can't index a song for some reason, we need to:
// - mark the song as missing lyrics
// - delete any existing song listens, as these are no longer relevant for our purposes
const markSongAsNotIndexed = async (
  {song, reason} : {song: Song, reason: string}
) => {
  const db = await getFirestoreDb();
  await db.runTransaction(async (transaction) => {
    // get all the song listens for the song
    const songListenSnaps = await transaction.get(db.collection("recent-listens").where(
      "songId", "==", song.id
    ));

    const affectedUsers = songListenSnaps.docs.map((doc) => doc.data().userId);

    // mark the song as not indexed
    transaction.update(db.collection("songs").doc(song.id), {
      songNotIndexedReason: reason,
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

// adds song and individual passages to search indexes
const addSongToSearch = async (
  song: Song,
  {
    songSentiments,
    songLyrics,
    albumColors,
    unvectorizedPassages,
    vectorizedPassages,
    labelingMetadata,
  } :
  {
    songSentiments: string[],
    songLyrics: string,
    albumColors: FinalColor[],
    unvectorizedPassages: LabeledPassage[],
    vectorizedPassages: VectorizedAndLabeledPassage[],
    labelingMetadata: {
      labeledBy: string | null,
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
        album: {
          ...song.album,
          image: {
            ...song.album.image,
            colors: albumColors,
          }
        },
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

// updates the sentiments for a song in the db after we've analyzed them
const updateSentimentsForSong = async (
  song: Song,
  sentiments: string[],
) => {
  const db = await getFirestoreDb();
  await db.collection("songs").doc(song.id).update({
    sentiments,
  });
}