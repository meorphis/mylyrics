import {configureStore} from '@reduxjs/toolkit';
import recommendationsReducer from './recommendations';
import activePassageReducer from './active_passage';

export const store = configureStore({
  reducer: {
    recommendations: recommendationsReducer,
    activePassage: activePassageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
