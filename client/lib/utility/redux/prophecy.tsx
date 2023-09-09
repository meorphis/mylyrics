import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {PassageType} from '../../types/passage';
import {getPassageId} from '../passage_id';

type ProphecyState = {
  cards: PassageType[];
  prophecy: string | null;
};

export const prophecySlice = createSlice({
  name: 'prophecy',
  initialState: {
    cards: [],
    prophecy: null,
  } as ProphecyState,
  reducers: {
    addCard: (state: ProphecyState, action: PayloadAction<PassageType>) => {
      if (state.cards.length >= 3) {
        throw new Error('Cannot add more than 3 cards to prophecy');
      }

      state.cards.push(action.payload);
    },
    removeCard: (state: ProphecyState, action: PayloadAction<PassageType>) => {
      const index = state.cards.findIndex(
        card => getPassageId(card) === getPassageId(action.payload),
      );
      if (index === -1) {
        throw new Error('Cannot remove card that is not in prophecy');
      }

      state.cards.splice(index, 1);
    },
    setProphecy: (
      state: ProphecyState,
      action: PayloadAction<string | null>,
    ) => {
      state.prophecy = action.payload;
    },
  },
});

export const {addCard, removeCard, setProphecy} = prophecySlice.actions;

export default prophecySlice.reducer as Reducer<ProphecyState>;
