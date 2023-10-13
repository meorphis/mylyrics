import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {
  TopSentimentData,
  TopSentimentsInterval,
} from '../../../types/sentiments';

type TopSentimentsState = {
  [interval in TopSentimentsInterval]: TopSentimentData[] | null;
};

type StatsState = {
  topSentiments: TopSentimentsState;
};

// allows adding and removing cards from the prophecy and setting the prophecy itself
export const statsSlice = createSlice({
  name: 'stats',
  initialState: {
    topSentiments: {},
  } as StatsState,
  reducers: {
    setTopSentiments: (state, action: PayloadAction<TopSentimentsState>) => {
      console.log(JSON.stringify(action.payload));
      state.topSentiments = action.payload;
    },
  },
});

export const {setTopSentiments} = statsSlice.actions;

export default statsSlice.reducer as Reducer<StatsState>;
