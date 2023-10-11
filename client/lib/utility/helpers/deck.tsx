import {useSelector} from 'react-redux';
import {useEffect, useState} from 'react';
import {runOnJS, useSharedValue, withTiming} from 'react-native-reanimated';
import {RootState} from '../redux';
import {isDeckFullyMeasured} from '../redux/measurement/helpers';
import {BundlePassageType, BundleType} from '../../types/bundle';
import _ from 'lodash';
import {usePassageHydration} from './passage';

// detects when we are going to have to wait for a bundle to be hydrated and/or measured before we
// can set it as active and (a) hydrates it if necessary and (b) returns a shared value that will
// reflect the readiness of the bundle to be set as active:
// - once we request a bundle change, if we need hydration/measurement, we animate the shared value to 0
// - once the hydration/measurement is complete, we animate the shared value back to 1
export const useSharedDecksTransition = () => {
  const sharedDecksOpacity = useSharedValue(1);

  const hydratePassages = usePassageHydration();

  const bundleInfo = useSelector((state: RootState) => {
    const requestedBundleKey =
      state.requestedBundleChange.currentlyRequestedBundleKey;

    if (requestedBundleKey == null) {
      return {
        requestedBundleKey: null,
        unhydratedPassages: [],
        deckIsReady: true,
      }
    }

    const bundle = state.bundles.bundles[requestedBundleKey];

    // includes passages that timed out previously
    const unhydratedPassages =  bundle.passages.filter(
      (passage) => state.albumArt[passage.song.album.image.url] == null
    );

    return {
      requestedBundleKey,
      unhydratedPassages,
      deckIsReady: isDeckReadyForDisplay({state, passages: bundle.passages}),
    };
  }, _.isEqual);

  useEffect(() => {
    hydratePassages(bundleInfo.unhydratedPassages);
  }, [bundleInfo.requestedBundleKey, bundleInfo.unhydratedPassages.length > 0]);

  const [fadeState, setFadeState] = useState<{
    fadingOut: boolean;
    fadedOut: boolean;
  }>({fadingOut: false, fadedOut: false});

  const {fadingOut, fadedOut} = fadeState;

  const onFadedOut = () => {
    setFadeState({fadingOut: false, fadedOut: true});
  };

  useEffect(() => {
    if (
      !bundleInfo.deckIsReady &&
      !fadingOut &&
      !fadedOut
    ) {
      setFadeState({fadingOut: true, fadedOut: false});
      sharedDecksOpacity.value = withTiming(
        0.5,
        {
          duration: 250,
        },
        () => {
          runOnJS(onFadedOut)();
        },
      );
    }
  }, [bundleInfo.deckIsReady, fadingOut, fadedOut]);

  useEffect(() => {
    if (bundleInfo.deckIsReady && fadedOut) {
      setFadeState({fadingOut: false, fadedOut: false});
      sharedDecksOpacity.value = withTiming(1, {
        duration: 250,
      });
    }
  }, [bundleInfo.deckIsReady, fadedOut]);

  return sharedDecksOpacity;
};

// gets the text to display when a deck is empty (in practice, generally raise an error because
// we currently don't expect decks other than likes to ever be empty)
export const getEmptyDeckText = ({bundle}: {bundle: BundleType}) => {
  const {
    info: {key: bundleKey},
  } = bundle;

  if (bundleKey === 'likes') {
    return "you haven't liked anything yet";
  } else {
    throw Error(`bundle ${bundleKey} should not be empty`);
  }
};

// returns a boolean indicating whether every lyric card contained in a deck
// has been fully measured and every image has either been downloaded or timed out
export const isDeckReadyForDisplay = (
  {state, passages}: {state: RootState, passages: BundlePassageType[]}
) => {
  return passages.every(p => {
    const imageUrl = p.song.album.image.url;
    // includes images with a null blob (i.e. images that were marked as timed out)
    return imageUrl in state.albumArt
  }) && isDeckFullyMeasured({state, passages});
}

// a hook wrapper for isDeckReadyForDisplay
export const useIsDeckReadyForDisplay = ({bundleKey}: {bundleKey: string}) => {
  return useSelector((state: RootState) => {
    const passages = state.bundles.bundles[bundleKey].passages;
    return (
      isDeckReadyForDisplay({state, passages})
    );
  });
};