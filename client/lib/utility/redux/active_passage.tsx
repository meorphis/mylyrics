import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {PassageItemKeyType} from '../../types/passage';

export const activePassageSlice = createSlice({
  name: 'active_passage',
  initialState: {
    groupKey: '',
    passageKey: '',
  },
  reducers: {
    setActivePassage: (
      state: PassageItemKeyType,
      action: PayloadAction<{
        groupKey?: string;
        passageKey?: string | null;
      }>,
    ) => {
      if (action.payload.groupKey) {
        state.groupKey = action.payload.groupKey;
      }
      if (action.payload.passageKey !== undefined) {
        state.passageKey = action.payload.passageKey;
      }
    },
  },
});

export const {setActivePassage} = activePassageSlice.actions;

export default activePassageSlice.reducer as Reducer<PassageItemKeyType>;
