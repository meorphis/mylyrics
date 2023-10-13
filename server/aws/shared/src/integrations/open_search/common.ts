// *** PUBLIC INTERFACE ***
// term to insert into queries to make sure that songs and artists that have been listened to
// recently and/or frequently are prioritized
export const getBoostsTerm = (
  {recentListens} : 
    {
      recentListens: Record<string, {songs?: Array<string>, artists?: Array<string>} | undefined>,
    }
): {
    boosts: unknown[],
    maxBoost: number,
  } => {
  // first get lists of songs and artists at all time scales
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
  
  // find songs that should have frequency boosts
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
  
  const songFrequency = new Map();
  
  // Count the frequency of each songId
  for (const songId of allSongs) {
    songFrequency.set(songId, (songFrequency.get(songId) || 0) + 1);
  }
    
  // Filter out the songs that appear more than 10 times
  const veryFrequentSongs = allSongs.filter((songId) => {
    return songFrequency.get(songId) > 10;
  });
        
  // songs that have been played several times, but that are not veryFrequentSongs
  const veryFrequentSongsSet = new Set(veryFrequentSongs);
  const frequentSongs = allSongs.filter((songId) => {
    return !veryFrequentSongsSet.has(songId) && songFrequency.get(songId) > 3;
  });
  
  // songs that have been played multiple times, but that are not veryFrequentSongs or frequentSongs
  const frequentSongsSet = new Set([...frequentSongs, ...veryFrequentSongs]);
  const slightlyFrequentSongs = allSongs.filter((songId) => {
    return !frequentSongsSet.has(songId) && songFrequency.get(songId) > 1;
  });
        
  const artistFrequency = new Map();
  for (const artistId of allArtists) {
    artistFrequency.set(artistId, (artistFrequency.get(artistId) || 0) + 1);
  }
  
  // artists that have been played many times
  const veryFrequentArtists = allArtists.filter((artistId) => {
    return artistFrequency.get(artistId) > 25;
  });
        
  // artists that have been played several times, but that are not veryFrequentArtists
  const veryFrequentArtistsSet = new Set(veryFrequentArtists);
  const frequentArtists = allArtists.filter((artistId) => {
    return !veryFrequentArtistsSet.has(artistId) && artistFrequency.get(artistId) > 10;
  });
  
  // artists that have been played multiple times, but that are not veryFrequentArtists or
  // frequentArtists
  const frequentArtistsSet = new Set([...frequentArtists, ...veryFrequentArtists]);
  const slightlyFrequentArtists = allArtists.filter((artistId) => {
    return !frequentArtistsSet.has(artistId) && artistFrequency.get(artistId) > 5;
  });
  
  // format the lists of songs and artists into filters for the search query
  const songFrequencyFilters = [
    veryFrequentSongs, frequentSongs, slightlyFrequentSongs
  ].map((songList) => {
    return songList.length ? {"ids": {"values": Array.from(new Set(songList))}} : null;
  });
  
  const artistFrequencyFilters = [
    veryFrequentArtists, frequentArtists, slightlyFrequentArtists
  ].map((artistList) => {
    return artistList.length ? {
      "terms": {"primaryArtist.id": Array.from(new Set(artistList))}
    } : null;
  });
  
  // songs generally get bigger boosts and artists but a more frequent artist is worth more than
  // a less frequent song
  const frequencyFilters = [
    songFrequencyFilters[0],
    artistFrequencyFilters[0],
    songFrequencyFilters[1],
    artistFrequencyFilters[1],
    songFrequencyFilters[2],
    artistFrequencyFilters[2],
  ];
  
  // now find songs and artists that should have recency boosts
  const rawSongRecencyBoostCandidates = [
    songsYesterday,
    songsLastWeek,
    songsLongerAgo,
  ];
  
  const rawArtistRecencyBoostCandidates = [
    artistsYesterday,
    artistsLastWeek,
    artistsLongerAgo,
  ];
  
  // make sure that no song gets a recency boost in more than one time scale
  const songRecencyFilters = rawSongRecencyBoostCandidates.map((boostCandidateList, i) => {
    const songsFromPreceedingLists = new Set(rawSongRecencyBoostCandidates.slice(0, i).flat());
    const filteredCandidateList = Array.from(new Set(boostCandidateList.filter((songId) => {
      return !songsFromPreceedingLists.has(songId);
    })));
    return filteredCandidateList.length ? {"ids": {"values": filteredCandidateList}} : null;
  });
        
  const artistRecencyFilters = rawArtistRecencyBoostCandidates.map((boostCandidateList, i) => {
    const artistsFromPreceedingLists = new Set(rawArtistRecencyBoostCandidates.slice(0, i).flat());
    const filteredCandidateList = Array.from(new Set(boostCandidateList.filter((artistId) => {
      return !artistsFromPreceedingLists.has(artistId);
    })));
    return filteredCandidateList.length ? {
      "terms": {"primaryArtist.id": filteredCandidateList}
    } : null;
  });
  
  // we generally want to boost songs that the user has actually listened to to the top;
  // if the user has a special affinity for a given song or artist that should break ties;
  // if the user has listened to a certain artist recently, that's still a signal though not as
  // important as the others
  const sortedBoostFilters = [
    ...songRecencyFilters,
    ...frequencyFilters,
    ...artistRecencyFilters,
  ].filter((f) => f != null)
  
  const recentListenFilters = sortedBoostFilters.map((filter, index) => {
    return {
      filter,
      // 2^x ensures that two lower-tier boosts cannot outweigh a higher-tier boost
      weight: Math.pow(2, sortedBoostFilters.length - index)
    }
  });
  
  // popularity boost will be a value between 0 and ~2, small enough to not outweigh any of the
  // other boosts but large enough to break ties
  const popularityBoost = {
    "filter" : {
      "match_all": {}
    },
    "field_value_factor": {
      "field": "popularity",
      "modifier": "log1p",
      "missing": 0
    },
  }
  
  const ret = {
    boosts: [...recentListenFilters, popularityBoost],
    maxBoost: Math.pow(2, recentListenFilters.length + 1),
  }
  
  return ret;
}