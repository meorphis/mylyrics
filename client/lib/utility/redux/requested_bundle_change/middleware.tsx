import {AnyAction, Dispatch, MiddlewareAPI} from '@reduxjs/toolkit';
import {RootState} from '..';
import {BundlePassageType} from '../../../types/bundle';
import {getMeasurementKey} from '../measurement/helpers';
import {setActiveBundlePassage} from '../bundles/slice';

// each time the state changes, checks to see if the currently requested bundle
// is ready to be set as active and does so if it is
export const requestedBundleChangeMiddleware =
  (store: MiddlewareAPI<Dispatch<AnyAction>, RootState>) =>
  (next: Dispatch<AnyAction>) =>
  (action: AnyAction) => {
    next(action);

    const state = store.getState();
    const requestedBundleKey =
      state.requestedBundleChange.currentlyRequestedBundleKey;
    if (!requestedBundleKey) {
      return;
    }
    const requestedBundle = state.bundles.bundles[requestedBundleKey];
    if (isDeckFullyMeasured({state, passages: requestedBundle.passages})) {
      const requestedBundlePassageKey =
        state.bundles.bundleKeyToPassageKey[requestedBundleKey];
      const requestedBundlePassage = requestedBundle.passages.find(
        p => p.passageKey === requestedBundlePassageKey,
      )!;
      store.dispatch(setActiveBundlePassage(requestedBundlePassage));
    }
  };

// indicates whether every card passage contained in the deck has a finalized
// scale and a measured y position
export const isDeckFullyMeasured = ({
  state,
  passages,
}: {
  state: RootState;
  passages: BundlePassageType[];
}) => {
  return passages.every(p => {
    const measurementKey = getMeasurementKey({
      globalPassageKey: p.passageKey,
      context: 'MAIN_SCREEN',
    });
    const measurement = state.lyricCardMeasurement.measurements[measurementKey];
    return (
      measurement &&
      measurement.lyricsYPosition != null &&
      measurement.scaleFinalized
    );
  });
};
