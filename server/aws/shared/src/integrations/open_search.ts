import { getSearchClient } from "./aws";
import { getFirestoreDb } from "./firebase";

// *** PUBLIC INTERFACE ***
// for a given user, we find the most relevant passages to show them for a given sentiment
// we do this by looking at their listening history - generally if a user has listened to
// a given song or artist more recently or frequently it will get a higher boost
export const getMostRelevantPassagesForSentiment = async (
  {userId, sentiment}: {userId: string, sentiment: string}
) => {
  const db = await getFirestoreDb();
  const [impressionsSnap, recentListensSnap] = await Promise.all([
    db.collection("user-impressions").doc(userId).get(),
    db.collection("user-recent-listens").doc(userId).get()
  ]);
  const impressions = impressionsSnap.data() || {};
  const passageImpressions = impressions.passages || [];
  const songImpressions = impressions.songs || [];

  const recentListens = recentListensSnap.data() || {};
  
  const searchClient = getSearchClient();
  searchClient.search({
    index: "song-lyric-passages",
    body: {
      query: {
        "function_score": {
          "query": {
            "bool": {
              "must_not": [
                // do not return passages that the user has already seen
                {"ids": {"values": passageImpressions}},

                // do not return passages from songs that the user has already seen
                {"terms": {"song.id": songImpressions}},

                // do not return passages that may be too long to fit on the screen
                {"range": {"metadata.numEffectiveLines": {"gt": 8}}},

                // only return passages with the specified sentiment
                {"bool": {
                  "must_not": {
                    "terms": {"sentiment": sentiment}
                  }
                }}
              ]
            }
          },
          "functions": getBoostsTermFromRecentListens({recentListens}),
          "boost_mode": "sum"
        }
      }
    }
  });
}

// *** PRIVATE HELPERS ***
const getBoostsTermFromRecentListens = (
  {recentListens} : 
  {recentListens: Record<string, {songs: Array<string>, artists: Array<string>} | undefined>}
) => {
  // first gets lists of songs and artists at all time scales
  const songsYesterday = recentListens.yesterday?.songs || [];
  const artistsYesterday = recentListens.yesterday?.artists || [];
  const songsLastWeek = [2, 3, 4, 5, 6, 7, 8].map((daysAgo) => {
    return recentListens[`daysago-${daysAgo}`]?.songs || [];
  }).flat();
  const artistsLastWeek = [2, 3, 4, 5, 6, 7, 8].map((daysAgo) => {
    return recentListens[`daysago-${daysAgo}`]?.artists || [];
  }).flat();
  const songsLongerAgo = recentListens.longerAgo?.songs || [];
  const artistsLongerAgo = recentListens.longerAgo?.artists || [];

  // first find frequency boosts
  const allSongs = [
    ...songsYesterday,
    ...songsLastWeek,
    ...songsLongerAgo,
  ];
      
  const allArtists = [
    ...artistsYesterday,
    ...artistsLastWeek,
    ...artistsLongerAgo,
  ];
      
  // songs that have been played many times
  const veryFrequentSongs = allSongs.filter((songId) => {
    return allSongs.filter((s) => s === songId).length > 10;
  });
      
  // songs that have been played several times, but that are not veryFrequentSongs
  const veryFrequentSongsSet = new Set(veryFrequentSongs);
  const frequentSongs = allSongs.filter((songId) => {
    return allSongs.filter((s) => s === songId && !veryFrequentSongsSet.has(songId)).length > 5;
  });


  // songs that have been played multiple times, but that are not veryFrequentSongs or frequentSongs
  const frequentSongsSet = new Set([...frequentSongs, ...veryFrequentSongs]);
  const slightlyFrequentSongs = allSongs.filter((songId) => {
    return allSongs.filter((s) => s === songId && !frequentSongsSet.has(songId)).length > 1;
  });
      
  // artists that have been played many times
  const veryFrequentArtists = allArtists.filter((artistId) => {
    return allArtists.filter((a) => a === artistId).length > 25;
  });
      
  // artists that have been played several times, but that are not veryFrequentArtists
  const veryFrequentArtistsSet = new Set(veryFrequentArtists);
  const frequentArtists = allArtists.filter((artistId) => {
    return allArtists.filter(
      (a) => a === artistId && !veryFrequentArtistsSet.has(artistId)
    ).length > 10;
  });

  // artists that have been played multiple times, but that are not veryFrequentArtists or
  // frequentArtists
  const frequentArtistsSet = new Set([...frequentArtists, ...veryFrequentArtists]);
  const slightlyFrequentArtists = allArtists.filter((artistId) => {
    return allArtists.filter(
      (a) => a === artistId && !frequentArtistsSet.has(artistId)
    ).length > 5;
  });

  const frequencyBoosts = [
    veryFrequentSongs,
    veryFrequentArtists,
    frequentSongs,
    frequentArtists,
    slightlyFrequentSongs,
    slightlyFrequentArtists,
  ];

  // then find recency boosts
  const rawSongRecencyBoosts = [
    songsYesterday,
    songsLastWeek,
    songsLongerAgo,
  ];

  const rawArtistRecencyBoosts = [
    artistsYesterday,
    artistsLastWeek,
    artistsLongerAgo,
  ];

  // make sure that no song gets a recency boost in more than one time scale
  const songRecencyBoosts = rawSongRecencyBoosts.map((boostList, i) => {
    const songsFromPreceedingLists = new Set(rawSongRecencyBoosts.slice(0, i).flat());
    return Array.from(new Set(boostList.filter((songId) => {
      return !songsFromPreceedingLists.has(songId);
    })));
  });
      
  const artistRecencyBoosts = rawArtistRecencyBoosts.map((boostList, i) => {
    const artistsFromPreceedingLists = new Set(rawArtistRecencyBoosts.slice(0, i).flat());
    return Array.from(new Set(boostList.filter((artistId) => {
      return !artistsFromPreceedingLists.has(artistId);
    })));
  });

  // we generally want to boost songs that the user has actually listened to to the top;
  // if the user has a special affinity for a given song or artist that should break ties;
  // if the user has listened to a certain artist recently, that's still a signal though not as
  // important as the others
  const sortedBoosts = [
    ...songRecencyBoosts,
    ...frequencyBoosts,
    ...artistRecencyBoosts,
  ];

  return sortedBoosts.map((boost, index) => {
    return {
      "filter": {"terms": boost},
      // 2^x ensures that two lower-tier boosts cannot outweigh a higher-tier boost
      "weight": Math.pow(2, sortedBoosts.length - index)
    }
  });  
}