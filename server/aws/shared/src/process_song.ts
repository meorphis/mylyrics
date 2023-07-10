import {getLyrics} from "./integrations/genius";
import {labelPassages, vectorizePassages} from "./integrations/open_ai/open_ai_integration";
import {PutItemCommand, UpdateItemCommand} from "@aws-sdk/client-dynamodb";
import {getSearchClient, dbClient} from "./utility/clients";
import {uuidForArtist, uuidForPassage, uuidForSong} from "./utility/uuid";
import {Song, VectorizedAndLabeledPassage} from "./utility/types";

// *** PUBLIC INTERFACE ***
// takes as input a song name and artist name and processes the song:
// - adds the song to dynamo (function returns early here if the song has already been added)
// - gets the lyrics from genius
// - uses openai to pick the best passages and analyze sentiments
// - adds the song to the search index
// - updates the song in dynamo with the sentiments
export const processSong = async (
  {songName, artistName} : {songName: string, artistName: string}
) => {
  // make sure we have all the environment variables we need
  assertEnvironmentVariables();

  const song = {
    songName,
    artistName,
    songId: uuidForSong({songName, artistName}),
    artistId: uuidForArtist({artistName}),
  };

  // the song was already added to the db so we assume that another lambda
  // is already processing it
  if (!addSongToDynamo(song)) {
    return;
  }

  // lyrics from genius integration
  const lyrics = await getLyrics({song});

  if (lyrics == null) {
    console.log(`no lyrics found for song: ${artistName}: ${songName}`)
    return;
  }

  console.log(`got lyrics for song: ${JSON.stringify(
    {
      song: `${artistName}: ${songName}`,
      lyrics,
    }
  )}`);

  // analysis from openai integration
  const {sentiments, passages} = await labelPassages({lyrics});

  console.log(`got analysis for song: ${JSON.stringify(
    {
      song: `${artistName}: ${songName}`,
      sentiments: sentiments.join(", "),
      passages: passages,
    }
  )}`);

  const vectorizedPassages = await vectorizePassages({labeledPassages: passages});

  console.log(`got vectorized passages for song ${songName} by ${artistName}`);

  await addSongToSearch(song, {sentiments, vectorizedPassages});
  console.log(`added song ${song.artistName}: ${song.songName} to search`);

  await updateSentimentsForSong(song, sentiments);
  console.log(`updated song ${song.artistName}: ${song.songName} with sentiments in dynamo`);
};

// *** PRIVATE HELPERS ***
const assertEnvironmentVariables = () => {
  if (process.env.SONG_TABLE_NAME == null) {
    throw new Error("SONG_TABLE_NAME is not defined in the environment");
  }

  if (process.env.OPENSEARCH_URL == null) {
    throw new Error("OPENSEARCH_URL is not defined in the environment");
  }
}

const addSongToDynamo = async (
  song: Song
): Promise<boolean>=> {
  try {
    await dbClient.send(new PutItemCommand({
      TableName: process.env.SONG_TABLE_NAME,
      Item: {
        "songId": {
          "S": song.songId
        },
        "artistId" : {
          "S": song.artistId
        },
        "songName": {
          "S": song.songName
        },
        "artistName": {
          "S": song.artistName
        },
      },
      // we achieve atomicity by using a conditional expression to make sure
      // the song doesn't already exist in the db, and handling the error if it does
      ConditionExpression: "songId <> :songId AND artistId <>  :artistid",
      ExpressionAttributeValues: {
        ":songId" : {"S": song.songId},
        ":artistid": {"S": song.artistId}
      }
    }));
  } catch (e) {
    if (e instanceof Error && e.name === "ConditionalCheckFailedException") {
      console.log(`song ${song.artistName}: ${song.songName} already exists in db`)
      return false;
    }

    throw e;
  }

  console.log(`added song ${song.artistName}: ${song.songName} to db`)

  return true;
}

const addSongToSearch = async (
  song: Song,
  {
    sentiments,
    vectorizedPassages,
  } :
  {
    sentiments: string[],
    vectorizedPassages: VectorizedAndLabeledPassage[],
  }
) => {
  await Promise.all(vectorizedPassages.map(async (passage) => {    
    return await getSearchClient().index({
      id: uuidForPassage({song, lyrics: passage.lyrics}),
      index: "song-lyric-passages",
      body: {
        ...passage,
        song: {
          id: song.songId,
          name: song.songName,
          sentiments,
        },
        artist: {
          id: song.artistId,
          name: song.artistName,
        },
        indexTime: Date.now(),
      },
      refresh: true,
    });
  }));
}

const updateSentimentsForSong = async (
  song: Song,
  sentiments: string[],
) => {
  await dbClient.send(new UpdateItemCommand(
    {
      TableName: process.env.SONG_TABLE_NAME,
      Key: {
        "songId": {
          "S": song.songId
        },
        "artistId": {
          "S": song.artistId
        },
      },
      UpdateExpression: "set sentiments = :sentiments",
      ExpressionAttributeValues: {
        ":sentiments": {
          "L": sentiments.map((s) => ({ "S": s }))
        },
      },
    }
  ));
}