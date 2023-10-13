import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {PassageType} from '../../../types/passage';

type ProphecyState = {
  cards: PassageType[];
  prophecy: string | null;
};

// allows adding and removing cards from the prophecy and setting the prophecy itself
export const prophecySlice = createSlice({
  name: 'prophecy',
  initialState: {
    cards: [],
    prophecy: null,
  } as ProphecyState,
  reducers: {
    addCard: (state: ProphecyState, action: PayloadAction<PassageType>) => {
      if (state.cards.length >= 3) {
        console.warn('Cannot add more than 3 cards to prophecy');
        return;
      }

      state.cards.push(action.payload);
    },
    removeCard: (state: ProphecyState, action: PayloadAction<PassageType>) => {
      const index = state.cards.findIndex(
        card => card.passageKey === action.payload.passageKey,
      );

      // could be a race condition from user mashing the button
      if (index === -1) {
        console.warn('Could not find card to remove from prophecy');
        return;
      }

      state.cards.splice(index, 1);
    },
    setProphecy: (
      state: ProphecyState,
      action: PayloadAction<string | null>,
    ) => {
      state.prophecy = action.payload;
    },
    resetProphecyState: () => {
      return {
        cards: [],
        prophecy: null,
      };
    },
  },
});

export const {addCard, removeCard, setProphecy, resetProphecyState} =
  prophecySlice.actions;

export default prophecySlice.reducer as Reducer<ProphecyState>;
