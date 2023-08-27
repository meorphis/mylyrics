import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';

export const likesSlice = createSlice({
  name: 'likes',
  initialState: {},
  reducers: {
    setLikes: (
      state: {[passageId: string]: boolean},
      action: PayloadAction<{[passageId: string]: boolean}>,
    ) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const {setLikes} = likesSlice.actions;

export default likesSlice.reducer as Reducer<{[passageId: string]: boolean}>;
