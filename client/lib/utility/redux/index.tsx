import {configureStore} from '@reduxjs/toolkit';
import recommendationsReducer from './recommendations';
import activePassageReducer from './active_passage';
import imageDataReducer from './image_data';
import horoscopeReducer from './horoscope';
import likesReducer from './likes';
import sentimentGroupsReducer from './sentiment_groups';
import {enableMapSet} from 'immer';

enableMapSet();

export const store = configureStore({
  reducer: {
    recommendations: recommendationsReducer,
    activePassage: activePassageReducer,
    imageData: imageDataReducer,
    horoscope: horoscopeReducer,
    likes: likesReducer,
    sentimentGroups: sentimentGroupsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
