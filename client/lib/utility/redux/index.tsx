import {configureStore} from '@reduxjs/toolkit';
import bundlesReducer from './bundles/slice';
import prophecyReducer from './prophecy/slice';
import lyricCardMeasurementReducer from './measurement/slice';
import requestedBundleChangeReducer from './requested_bundle_change/slice';
import shareablePassagetReducer from './shareable_passage/slice';
import {enableMapSet} from 'immer';
import {requestedBundleChangeMiddleware} from './requested_bundle_change/middleware';
import {logTimingMiddleware} from './timing/middleware';

enableMapSet();

export const store = configureStore({
  reducer: {
    bundles: bundlesReducer,
    lyricCardMeasurement: lyricCardMeasurementReducer,
    prophecy: prophecyReducer,
    requestedBundleChange: requestedBundleChangeReducer,
    shareablePassage: shareablePassagetReducer,
  },
  middleware: [logTimingMiddleware, requestedBundleChangeMiddleware],
});

export type RootState = {
  bundles: ReturnType<typeof bundlesReducer>;
  lyricCardMeasurement: ReturnType<typeof lyricCardMeasurementReducer>;
  prophecy: ReturnType<typeof prophecyReducer>;
  requestedBundleChange: ReturnType<typeof requestedBundleChangeReducer>;
  shareablePassage: ReturnType<typeof shareablePassagetReducer>;
};
