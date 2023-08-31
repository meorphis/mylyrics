import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {
  PassageGroupRequestType,
  PassageGroupRequestsType,
  PassageGroupsType,
} from '../../types/passage';

const EXPECTED_NUM_PASSAGES_WHEN_FULLY_LOADED = 5;

export const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState: [] as PassageGroupRequestsType,
  reducers: {
    markPassageGroupAsLoading: (
      state: PassageGroupRequestsType,
      action: PayloadAction<{groupKey: string}>,
    ) => {
      const groupIndex = state.findIndex(
        ({groupKey}) => groupKey === action.payload.groupKey,
      );
      if (groupIndex !== -1) {
        state[groupIndex] = {
          ...state[groupIndex],
          passageGroupRequest: {
            ...state[groupIndex].passageGroupRequest,
            status: 'loading',
          },
        };
      } else {
        state.push({
          groupKey: action.payload.groupKey,
          passageGroupRequest: {
            data: [],
            status: 'loading',
          },
        });
      }
    },
    markPassageGroupAsError: (
      state: PassageGroupRequestsType,
      action: PayloadAction<{groupKey: string; error: string}>,
    ) => {
      const groupIndex = state.findIndex(
        ({groupKey}) => groupKey === action.payload.groupKey,
      );
      if (groupIndex !== -1) {
        state[groupIndex] = {
          ...state[groupIndex],
          passageGroupRequest: {
            ...state[groupIndex].passageGroupRequest,
            status: 'error',
            error: action.payload.error,
          },
        };
      } else {
        state.push({
          groupKey: action.payload.groupKey,
          passageGroupRequest: {
            data: [],
            status: 'error',
            error: action.payload.error,
          },
        });
      }
    },
    initPassageGroups: (
      state: PassageGroupRequestsType,
      action: PayloadAction<string[]>,
    ) => {
      const newState: PassageGroupRequestsType = [];

      action.payload.forEach(groupKey => {
        newState.push({
          groupKey,
          passageGroupRequest: {
            data: [],
            status: 'init',
          },
        });
      });

      return newState;
    },
    addLoadedPassageGroups: (
      state: PassageGroupRequestsType,
      action: PayloadAction<PassageGroupsType>,
    ) => {
      action.payload.forEach(({groupKey, passageGroup}) => {
        const previousIndex = state.findIndex(
          ({groupKey: gk}) => gk === groupKey,
        );

        if (previousIndex === -1) {
          return;
        }

        const updated = [
          ...state[previousIndex].passageGroupRequest.data,
          ...passageGroup,
        ];

        const newPassageGroupRequestContainer = {
          groupKey,
          passageGroupRequest: {
            data: updated,
            status:
              updated.length >= EXPECTED_NUM_PASSAGES_WHEN_FULLY_LOADED
                ? 'loaded'
                : 'init',
          } as PassageGroupRequestType,
        };

        if (previousIndex !== -1) {
          state[previousIndex] = newPassageGroupRequestContainer;
        } else {
          state.push(newPassageGroupRequestContainer);
        }
      });
    },
  },
});

export const {
  markPassageGroupAsLoading,
  markPassageGroupAsError,
  initPassageGroups,
  addLoadedPassageGroups,
} = recommendationsSlice.actions;

export default recommendationsSlice.reducer as Reducer<PassageGroupRequestsType>;
