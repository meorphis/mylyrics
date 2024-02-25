import {AnyAction, configureStore} from '@reduxjs/toolkit';
import bundlesReducer from './bundles/slice';
import prophecyReducer from './prophecy/slice';
import lyricCardMeasurementReducer from './measurement/slice';
import requestedBundleChangeReducer from './requested_bundle_change/slice';
import shareablePassagetReducer from './shareable_passage/slice';
import cardFlipReducer from './card_flip/slice';
import albumArtReducer from './album_art/slice';
import statsReducer from './stats/slice';
import {enableMapSet} from 'immer';
import {requestedBundleChangeMiddleware} from './requested_bundle_change/middleware';
import {logTimingMiddleware} from './timing/middleware';
import _ from 'lodash';

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
    albumArt: albumArtReducer(state?.albumArt, action),
    stats: statsReducer(state?.stats, action),
    cardFlip: cardFlipReducer(state?.cardFlip, action),
  };

  // keep the bundles that are not from recommendations when resetting recommendations
  if (action.type === 'RESET_RECOMMENDATIONS' && originalState) {
    newState = {
      ...newState,
      bundles: {
        ...newState.bundles,
        bundles: _.cloneDeep(originalState.bundles.bundles),
        bundleKeyToPassageKey: _.cloneDeep(
          originalState.bundles.bundleKeyToPassageKey,
        ),
      },
    };

    Object.entries(newState.bundles.bundles).forEach(([bundleKey, bundle]) => {
      if (['top', 'artist', 'sentiment'].includes(bundle.info.type)) {
        console.log('deleting', bundle.info.key);
        delete newState.bundles.bundles[bundleKey];
        delete newState.bundles.bundleKeyToPassageKey[bundleKey];
      }
    });

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
  albumArt: ReturnType<typeof albumArtReducer>;
  stats: ReturnType<typeof statsReducer>;
  cardFlip: ReturnType<typeof cardFlipReducer>;
};
