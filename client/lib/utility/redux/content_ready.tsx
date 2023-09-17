import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';

export const contentReadySlice = createSlice({
  name: 'content_ready',
  initialState: [] as string[],
  reducers: {
    addContentReadyPassageId: (
      state: string[],
      action: PayloadAction<string>,
    ) => {
      if (!state.includes(action.payload)) {
        return [...state, action.payload];
      }
    },
  },
});

export const {addContentReadyPassageId} = contentReadySlice.actions;

export default contentReadySlice.reducer as Reducer<string[]>;
