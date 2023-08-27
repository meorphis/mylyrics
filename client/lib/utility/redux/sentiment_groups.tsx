import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';

export const sentimentGroupsSlice = createSlice({
  name: 'sentiment_groups',
  initialState: {} as {group: string; sentiments: string[]}[],
  reducers: {
    setSentimentGroups: (
      state: {group: string; sentiments: string[]}[],
      action: PayloadAction<{group: string; sentiments: string[]}[]>,
    ) => {
      return action.payload;
    },
  },
});

export const {setSentimentGroups} = sentimentGroupsSlice.actions;

export default sentimentGroupsSlice.reducer as Reducer<
  {group: string; sentiments: string[]}[]
>;
