import {configureStore} from '@reduxjs/toolkit';
import recommendationsReducer from './recommendations';
import activePassageReducer from './active_passage';
import imageDataReducer from './image_data';
import {enableMapSet} from 'immer';

enableMapSet();

export const store = configureStore({
  reducer: {
    recommendations: recommendationsReducer,
    activePassage: activePassageReducer,
    imageData: imageDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
