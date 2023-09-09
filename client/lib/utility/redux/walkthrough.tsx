import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {WalkthroughStep, WalkthroughStepStatus} from '../../types/walkthrough';

type WalkthroughState = {
  [step in WalkthroughStep]: WalkthroughStepStatus;
};

export const walkthroughSlice = createSlice({
  name: 'walkthrough',
  initialState: {} as WalkthroughState,
  reducers: {
    setWalkthroughStepStateAsCompleted: (
      state: WalkthroughState,
      action: PayloadAction<WalkthroughStep>,
    ) => {
      return {
        ...state,
        [action.payload]: 'completed',
      };
    },
    setWalkthroughStepStateAsReady: (
      state: {[step in WalkthroughStep]: WalkthroughStepStatus},
      action: PayloadAction<WalkthroughStep>,
    ) => {
      return {
        ...state,
        [action.payload]: 'ready',
      };
    },
  },
});

export const {
  setWalkthroughStepStateAsCompleted,
  setWalkthroughStepStateAsReady,
} = walkthroughSlice.actions;

export default walkthroughSlice.reducer as Reducer<WalkthroughState>;
