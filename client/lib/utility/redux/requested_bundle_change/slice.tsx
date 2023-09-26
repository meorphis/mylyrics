import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {setActiveBundlePassage} from '../bundles/slice';

type State = {
  currentlyRequestedBundleKey: string | null;
  allRequestedBundleKeys: string[];
};

// allows requesting a change to the active bundle passage and automatically
// clears the request once it goes through
export const requestBundleChangeSlice = createSlice({
  name: 'requested_bundle_change',
  initialState: {
    currentlyRequestedBundleKey: null,
    allRequestedBundleKeys: [] as string[],
  },
  reducers: {
    requestBundleChange: (
      state: State,
      action: PayloadAction<{bundleKey: string}>,
    ) => {
      const {bundleKey} = action.payload;
      state.currentlyRequestedBundleKey = bundleKey;
      if (!state.allRequestedBundleKeys.includes(bundleKey)) {
        state.allRequestedBundleKeys.push(bundleKey);
        state.allRequestedBundleKeys.sort();
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(setActiveBundlePassage, (state, action) => {
      const {bundleKey} = action.payload;
      if (state.currentlyRequestedBundleKey === bundleKey) {
        state.currentlyRequestedBundleKey = null;
      }
      if (!state.allRequestedBundleKeys.includes(bundleKey)) {
        state.allRequestedBundleKeys.push(bundleKey);
      }
    });
  },
});

export const {requestBundleChange} = requestBundleChangeSlice.actions;

export default requestBundleChangeSlice.reducer as Reducer<State>;
