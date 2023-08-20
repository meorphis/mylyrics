import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';

export const horoscopeSlice = createSlice({
  name: 'horoscope',
  initialState: '',
  reducers: {
    setHoroscope: (state: string, action: PayloadAction<string>) => {
      return action.payload;
    },
  },
});

export const {setHoroscope} = horoscopeSlice.actions;

export default horoscopeSlice.reducer as Reducer<string>;
