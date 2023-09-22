import {configureStore} from '@reduxjs/toolkit';
import recommendationsReducer from './recommendations';
import activePassageReducer from './active_passage';
import prophecyReducer from './prophecy';
import recentLikesReducer from './recent_likes';
import sentimentGroupsReducer from './sentiment_groups';
import contentReadyReducer from './content_ready';
import {enableMapSet} from 'immer';

enableMapSet();

export const store = configureStore({
  reducer: {
    recommendations: recommendationsReducer,
    activePassage: activePassageReducer,
    prophecy: prophecyReducer,
    recentLikes: recentLikesReducer,
    sentimentGroups: sentimentGroupsReducer,
    contentReady: contentReadyReducer,
  },
  middleware: [
    _ => next => action => {
      const start = performance.now();
      const result = next(action);
      const end = performance.now();
      console.log(`${action.type} took ${end - start} ms`);
      return result;
    },
  ],
});

export type RootState = ReturnType<typeof store.getState>;
