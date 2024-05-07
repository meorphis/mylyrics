import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {getIsFlippedKey} from './util';

type CardFlipState = {
  should_autoflip: boolean;
  is_flipped: Record<string, boolean>;
};

// allows adding and removing cards from the prophecy and setting the prophecy itself
export const cardFlipSlice = createSlice({
  name: 'card_flip',
  initialState: {
    should_autoflip: false,
    is_flipped: {},
  } as CardFlipState,
  reducers: {
    requestAutoflip: (state: CardFlipState) => {
      state.should_autoflip = true;
    },
    acknowledgeAutoflip: (state: CardFlipState) => {
      state.should_autoflip = false;
    },
    toggleFlippedState: (
      state: CardFlipState,
      action: PayloadAction<{bundleKey: string; passageKey: string}>,
    ) => {
      const key = getIsFlippedKey(action.payload);
      state.is_flipped[key] = !(state.is_flipped[key] ?? false);
    },
  },
});

export const {requestAutoflip, acknowledgeAutoflip, toggleFlippedState} =
  cardFlipSlice.actions;

export default cardFlipSlice.reducer as Reducer<CardFlipState>;
