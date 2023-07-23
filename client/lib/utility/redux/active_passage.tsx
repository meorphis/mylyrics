import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {PassageItemKey} from '../../types/passage';

export const activePassageSlice = createSlice({
  name: 'active_passage',
  initialState: {
    groupKey: '',
    passageKey: '',
  },
  reducers: {
    setActivePassage: (
      state: PassageItemKey,
      action: PayloadAction<{
        groupKey?: string;
        passageKey?: string;
      }>,
    ) => {
      if (action.payload.groupKey) {
        state.groupKey = action.payload.groupKey;
      }
      if (action.payload.passageKey) {
        state.passageKey = action.payload.passageKey;
      }
    },
  },
});

export const {setActivePassage} = activePassageSlice.actions;

export default activePassageSlice.reducer as Reducer<PassageItemKey>;
