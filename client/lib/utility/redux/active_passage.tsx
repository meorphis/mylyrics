import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';

type ActivePassageState = {
  groupKeyToPassageKey: {
    [groupKey: string]: string;
  };
  activeGroupKey: string | null;
};

export const activePassageSlice = createSlice({
  name: 'active_passage',
  initialState: {
    groupKeyToPassageKey: {},
    activeGroupKey: null,
  },
  reducers: {
    setActivePassage: (
      state: ActivePassageState,
      action: PayloadAction<{
        groupKey?: string;
        passageKey?: string | null;
      }>,
    ) => {
      const {groupKey, passageKey} = action.payload;

      if (groupKey) {
        state.activeGroupKey = groupKey;
      }

      if (state.activeGroupKey == null) {
        throw new Error('cannot set active passage without active group');
      }

      if (passageKey) {
        state.groupKeyToPassageKey[state.activeGroupKey] = passageKey;
      }
    },
  },
});

export const {setActivePassage} = activePassageSlice.actions;

export default activePassageSlice.reducer as Reducer<ActivePassageState>;
