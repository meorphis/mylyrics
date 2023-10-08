import {AnyAction, configureStore} from '@reduxjs/toolkit';
import bundlesReducer from './bundles/slice';
import prophecyReducer from './prophecy/slice';
import lyricCardMeasurementReducer from './measurement/slice';
import requestedBundleChangeReducer from './requested_bundle_change/slice';
import shareablePassagetReducer from './shareable_passage/slice';
import {enableMapSet} from 'immer';
import {requestedBundleChangeMiddleware} from './requested_bundle_change/middleware';
import {logTimingMiddleware} from './timing/middleware';

enableMapSet();

const rootReducer = (
  state: RootState | undefined,
  action: AnyAction,
): RootState => {
  const originalState = state;

  // essentially wipe everything except for some bundles (see below) when resetting recommendations
  if (action.type === 'RESET_RECOMMENDATIONS' && state) {
    state = undefined;
  }

  let newState = {
    bundles: bundlesReducer(state?.bundles, action),
    lyricCardMeasurement: lyricCardMeasurementReducer(
      state?.lyricCardMeasurement,
      action,
    ),
    prophecy: prophecyReducer(state?.prophecy, action),
    requestedBundleChange: requestedBundleChangeReducer(
      state?.requestedBundleChange,
      action,
    ),
    shareablePassage: shareablePassagetReducer(state?.shareablePassage, action),
  };

  // keep the bundles that are not from recommendations when resetting recommendations
  if (action.type === 'RESET_RECOMMENDATIONS' && originalState) {
    Object.entries(originalState.bundles.bundles).forEach(
      ([bundleKey, bundle]) => {
        if (['top', 'artist', 'sentiment'].includes(bundle.info.type)) {
          delete originalState.bundles.bundles[bundleKey];
          delete originalState.bundles.bundleKeyToPassageKey[bundleKey];
        }
      },
    );

    newState = {
      ...newState,
      bundles: {
        ...newState.bundles,
        bundles: originalState.bundles.bundles,
        bundleKeyToPassageKey: originalState.bundles.bundleKeyToPassageKey,
      },
    };

    newState.bundles.bundleKeyToPassageKey =
      originalState.bundles.bundleKeyToPassageKey;
  }

  return newState;
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: [logTimingMiddleware, requestedBundleChangeMiddleware],
});

export type RootState = {
  bundles: ReturnType<typeof bundlesReducer>;
  lyricCardMeasurement: ReturnType<typeof lyricCardMeasurementReducer>;
  prophecy: ReturnType<typeof prophecyReducer>;
  requestedBundleChange: ReturnType<typeof requestedBundleChangeReducer>;
  shareablePassage: ReturnType<typeof shareablePassagetReducer>;
};
