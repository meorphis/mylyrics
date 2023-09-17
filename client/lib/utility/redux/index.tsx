import {configureStore} from '@reduxjs/toolkit';
import recommendationsReducer from './recommendations';
import activePassageReducer from './active_passage';
import prophecyReducer from './prophecy';
import recentLikesReducer from './recent_likes';
import sentimentGroupsReducer from './sentiment_groups';
import {enableMapSet} from 'immer';

enableMapSet();

export const store = configureStore({
  reducer: {
    recommendations: recommendationsReducer,
    activePassage: activePassageReducer,
    prophecy: prophecyReducer,
    recentLikes: recentLikesReducer,
    sentimentGroups: sentimentGroupsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
