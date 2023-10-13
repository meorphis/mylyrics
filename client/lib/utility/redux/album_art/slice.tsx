import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';

// store for album art blobs
export const albumArtSlice = createSlice({
  name: 'album_art',
  initialState: {} as {[key: string]: string | null},
  reducers: {
    addAlbumArt: (
      state,
      action: PayloadAction<{url: string; blob: string}>,
    ) => {
      const {url, blob} = action.payload;
      state[url] = blob;
    },
    // album art maybe be temporarily or permanently missing if it takes too long to load
    // or there's an error
    maybeSetAlbumArtAsMissing: (
      state,
      action: PayloadAction<{url: string}>,
    ) => {
      const {url} = action.payload;
      state[url] ??= null;
    },
  },
});

export const {addAlbumArt, maybeSetAlbumArtAsMissing} = albumArtSlice.actions;

export default albumArtSlice.reducer as Reducer<{[key: string]: string | null}>;
