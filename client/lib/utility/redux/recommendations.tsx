import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {PassageGroupsDataType, PassageGroupsType} from '../../types/passage';
import {errorToString} from '../error';

const EXPECTED_NUM_PASSAGES_WHEN_FULLY_LOADED = 1;

export const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState: {},
  reducers: {
    markPassageGroupAsLoading: (
      state: PassageGroupsDataType,
      action: PayloadAction<{groupKey: string}>,
    ) => {
      state[action.payload.groupKey] ||= {
        data: {},
        status: 'init',
      };
      state[action.payload.groupKey].status = 'loading';
    },
    markPassageGroupAsError: (
      state: PassageGroupsDataType,
      action: PayloadAction<{groupKey: string; error: Error}>,
    ) => {
      state[action.payload.groupKey] = {
        ...state[action.payload.groupKey],
        status: 'error',
        error: errorToString(action.payload.error),
      };
    },
    applyLoadedPassageGroups: (
      state: PassageGroupsDataType,
      action: PayloadAction<PassageGroupsType>,
    ) => {
      Object.entries(action.payload).forEach(([groupKey, group]) => {
        const previous = state[groupKey]?.data;
        const updated = {
          ...previous,
          ...group,
        };

        state[groupKey] = {
          status:
            Object.keys(updated).length >=
            EXPECTED_NUM_PASSAGES_WHEN_FULLY_LOADED
              ? 'loaded'
              : 'init',
          data: updated,
        };
      });
    },
  },
});

export const {
  markPassageGroupAsLoading,
  markPassageGroupAsError,
  applyLoadedPassageGroups,
} = recommendationsSlice.actions;

export default recommendationsSlice.reducer as Reducer<PassageGroupsDataType>;
