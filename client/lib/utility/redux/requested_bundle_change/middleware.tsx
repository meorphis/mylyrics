import {AnyAction, Dispatch, MiddlewareAPI} from '@reduxjs/toolkit';
import {RootState} from '..';
import {setActiveBundlePassage, setEmptyBundle} from '../bundles/slice';
import {isDeckReadyForDisplay} from '../../helpers/deck';

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
    if (isDeckReadyForDisplay({state, passages: requestedBundle.passages})) {
      const requestedBundlePassageKey =
        state.bundles.bundleKeyToPassageKey[requestedBundleKey];

      if (requestedBundlePassageKey === null) {
        store.dispatch(setEmptyBundle({bundleKey: requestedBundleKey}));
      } else {
        const requestedBundlePassage = requestedBundle.passages.find(
          p => p.passageKey === requestedBundlePassageKey,
        )!;
        store.dispatch(setActiveBundlePassage(requestedBundlePassage));
      }
    }
  };
