import {getLyrics} from "./integrations/genius";
import {
  getArtistEmoji, labelPassagesOpenAI, vectorizePassages
} from "./integrations/llm/open_ai_integration";
import {getSearchClient} from "./integrations/aws";
import {uuidForPassage} from "./utility/uuid";
import {LabeledPassage, LabelingMetadata, Song, VectorizedAndLabeledPassage} from "./utility/types";
import { getFirestoreDb } from "./integrations/firebase";
import {FieldValue} from "firebase-admin/firestore";
import { getImageColors } from "./utility/image";
import { FinalColor } from "extract-colors/lib/types/Color";
import { labelPassagesAnthropic } from "./integrations/llm/anthropic_integration";
import { addMetadataToPassage } from "./utility/recommendations";
import { normalizePassageLyrics, normalizeSongLyrics } from "./utility/lyrics";

// *** PUBLIC INTERFACE ***
// takes as input a song name and artist name and processes the song:
// - adds the song to db (function returns early here if the song has already been added)
// - gets the lyrics from genius
// - uses openai to pick the best passages and analyze sentiments
// - adds the song to the search index
// - updates the song in db with the sentiments
export const processSong = async (
  {song, triggeredBy}: {song: Song, triggeredBy: string}
) => {
  // make sure we have all the environment variables we need
  assertEnvironmentVariables();

  const db = await getFirestoreDb();

  // the song was already added to the db so we assume that another lambda
  // is already processing it
  if (!(await addSongToDb(song))) {
    return;
  }

  if (song.album.image.url == null) {
    console.log(
      `no image found for song: ${song.primaryArtist.name}: ${song.name}`
    )
    await markSongAsNotIndexed({song, reason: "no_image", indexTriggeredBy: triggeredBy});
    return;
  }

  // lyrics from genius integration
  const getLyricsResponse = await getLyrics({song});

  if (getLyricsResponse.outcome === "failure") {
    console.log(
      // eslint-disable-next-line max-len
      `no lyrics found for song (${getLyricsResponse.reason}): ${song.primaryArtist.name}: ${song.name}`
    )
    await markSongAsNotIndexed(
      {song, reason: getLyricsResponse.reason, indexTriggeredBy: triggeredBy}
    );
    return;
  }

  const {lyrics: unnormalizedSongLyrics} = getLyricsResponse;

  console.log(`got lyrics for song: ${JSON.stringify(
    {
      song: `${song.primaryArtist.name}: ${song.name}`,
      unnormalizedSongLyrics,
    }
  )}`);

  let successfuLabelPassagesResponse: { 
    status: "success";
    content: { sentiments: string[]; passages: LabeledPassage[]; metadata: LabelingMetadata}
  }

  // get analysis from anthropic integration and image colors in parallel
  const [labelPassagesResponseAnthropic, colors] = await Promise.all([
    labelPassagesAnthropic({lyrics: unnormalizedSongLyrics}),
    getImageColors({url: song.album.image.url})
  ]);

  if (labelPassagesResponseAnthropic.status === "success") {
    successfuLabelPassagesResponse = labelPassagesResponseAnthropic;
  } else {
    // try open AI if for some reason anthropic fails
    const labelPassagesOpenAIResponse = await labelPassagesOpenAI({lyrics: unnormalizedSongLyrics});
    if (labelPassagesOpenAIResponse.status === "success") {
      successfuLabelPassagesResponse = labelPassagesOpenAIResponse;
    } else {
      console.log(
        `error labeling passages for song: ${song.primaryArtist.name}: ${song.name}`
      )
      await markSongAsNotIndexed({song, reason: "error_labeling", indexTriggeredBy: triggeredBy});
      return;
    }
  }

  const {
    sentiments: songSentiments, passages: unnormalizedPassages, metadata: labelingMetadata
  } = successfuLabelPassagesResponse.content;

  if (unnormalizedPassages.length === 0) {
    console.log(
      `no passages found for song: ${song.primaryArtist.name}: ${song.name}`
    )
    await markSongAsNotIndexed({song, reason: "no_passages", indexTriggeredBy: triggeredBy});
    return;
  }

  if (colors == null) {
    console.log(
      `no colors found for song: ${song.primaryArtist.name}: ${song.name}`
    )
    await markSongAsNotIndexed({song, reason: "no_colors", indexTriggeredBy: triggeredBy});
    return;
  }

  console.log(`got analysis for song: ${JSON.stringify(
    {
      song,
      songSentiments,
      unnormalizedPassages,
    }
  )}`);

  const normalizedSongLyrics = normalizeSongLyrics(unnormalizedSongLyrics);
  const normalizedPassages: LabeledPassage[] = unnormalizedPassages.map((passage) => {
    const normalizedPassageLyrics = normalizePassageLyrics({
      normalizedSongLyrics,
      passageLyrics: passage.lyrics,
    });

    if (normalizedPassageLyrics == null) {
      console.log(
        // eslint-disable-next-line max-len
        `passage lyrics not found in song lyrics for song: ${song.primaryArtist.name}: ${song.name}; passage lyrics: ${passage.lyrics}`
      )
      db.collection("orphan-passages").doc(uuidForPassage({
        lyrics: passage.lyrics,
        songName: song.name,
        artistName: song.primaryArtist.name,
      })).set({
        songId: song.id,
        songName: song.name,
        artistId: song.primaryArtist.id,
        artistName: song.primaryArtist.name,
        passageLyrics: passage.lyrics,
        normalizedSongLyrics,
      });
      return null;
    }

    return {
      ...passage,
      lyrics: normalizedPassageLyrics,
      metadata: {
        ...passage.metadata,
      },
    }
  }).filter((passage) => passage != null) as LabeledPassage[];

  const vectorizedPassages = await vectorizePassages({labeledPassages: [
    ...normalizedPassages,
    // include the full song as a passage since it may be useful for semantic search
    {
      ...addMetadataToPassage({
        lyrics: normalizedSongLyrics,
        sentiments: songSentiments,
      }),
      isFullSong: true,
    }
  ]});

  console.log(`got vectorized passages for song ${song.name} by ${song.primaryArtist.name}`);

  await addSongToSearch(
    song,
    {
      songSentiments,
      songLyrics: normalizedSongLyrics,
      albumColors: colors,
      unvectorizedPassages: normalizedPassages,
      vectorizedPassages,
      labelingMetadata
    }
  );
  console.log(`added song ${song.primaryArtist.name}: ${song.name} to search`);

  await updateSongAfterIndexing(
    {song, sentiments: songSentiments, labeledBy: labelingMetadata.labeledBy}
  );
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
  const artistDocRef = db.collection("artists").doc(song.primaryArtist.id);

  const result = await db.runTransaction(async (transaction) => {
    const [songDoc, artistDoc] = await transaction.getAll(songDocRef, artistDocRef);

    const artistNeedsEmoji = !artistDoc.exists || artistDoc.data()?.artistEmoji == null;

    if (songDoc.exists) {
      console.log(`song ${song.primaryArtist.name}: ${song.name} already exists in db`)
      return {
        songAdded: false,
        artistNeedsEmoji,
      };
    }

    transaction.set(songDocRef, {
      songId: song.id,
      artistId: song.primaryArtist.id,
      songName: song.name,
      artistName: song.primaryArtist.name,
      labeledBy: null,
    });

    const artistData = artistDoc.data();
    transaction.set(artistDocRef, {
      artistId: song.primaryArtist.id,
      artistName: song.primaryArtist.name,
      numIndexedSongs: artistData ? artistData.numIndexedSongs + 1 : 1,
    }, {merge: true});

    console.log(`added song ${song.primaryArtist.name}: ${song.name} to db`)
    return {
      songAdded: true,
      artistNeedsEmoji,
    };
  });

  if (result.artistNeedsEmoji) {
    try {
      const artistEmoji = await getArtistEmoji({artistName: song.primaryArtist.name})
      await artistDocRef.update({artistEmoji})
    } catch (e) {
      console.log(`error getting artist emoji for ${song.primaryArtist.name}: ${e}`)
    }
  }

  return result.songAdded;
}

// if we can't index a song for some reason, we need to:
// - mark the song as missing lyrics
// - delete any existing song listens for the user who triggered the index, so that their
//    recent listens more cleanly map to songs that we have data for (note that a user who
//    did not trigger this index may still have a song listen for this song, but that's an
//    edge case that would require building a separate look-up table to address)
const markSongAsNotIndexed = async (
  {song, reason, indexTriggeredBy} : {song: Song, reason: string, indexTriggeredBy: string}
) => {
  const db = await getFirestoreDb();

  await Promise.all([
  // mark the song as not indexed
    db.collection("songs").doc(song.id).update({
      songNotIndexedReason: reason,
    }),
    // remove the song listen for the user that triggered the index
    db.collection("user-recent-listens").doc(indexTriggeredBy).update({
      // it's probably in today.songs but for a new user, we could have
      // put it in one of the other buckets
      "today.songs": FieldValue.arrayRemove(song.id),
      "yesterday.songs": FieldValue.arrayRemove(song.id),
      "daysAgo2.songs": FieldValue.arrayRemove(song.id),
      "daysAgo3.songs": FieldValue.arrayRemove(song.id),
      "daysAgo4.songs": FieldValue.arrayRemove(song.id),
      "daysAgo5.songs": FieldValue.arrayRemove(song.id),
      "daysAgo6.songs": FieldValue.arrayRemove(song.id),
      "daysAgo7.songs": FieldValue.arrayRemove(song.id),
      "daysAgo8.songs": FieldValue.arrayRemove(song.id),
      "longerAgo.songs": FieldValue.arrayRemove(song.id),
    })
  ])
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
      isFullSong: false, // will be overridden by the passage object if it was set
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
      album: {
        ...songRest.album,
        image: {
          ...songRest.album.image,
          colors: albumColors,
        }
      },
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
const updateSongAfterIndexing = async ({song, sentiments, labeledBy}: {
  song: Song,
  sentiments: string[],
  labeledBy: string,
}) => {
  const db = await getFirestoreDb();
  await db.collection("songs").doc(song.id).update({
    sentiments,
    labeledBy,
  });
}