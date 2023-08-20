import {configureStore} from '@reduxjs/toolkit';
import recommendationsReducer from './recommendations';
import activePassageReducer from './active_passage';
import imageDataReducer from './image_data';
import horoscopeReducer from './horoscope';
import {enableMapSet} from 'immer';

enableMapSet();

export const store = configureStore({
  reducer: {
    recommendations: recommendationsReducer,
    activePassage: activePassageReducer,
    imageData: imageDataReducer,
    horoscope: horoscopeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
