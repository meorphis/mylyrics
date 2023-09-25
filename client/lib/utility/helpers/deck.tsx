import {useSelector} from 'react-redux';
import {useEffect, useState} from 'react';
import {runOnJS, useSharedValue, withTiming} from 'react-native-reanimated';
import {RootState} from '../redux';
import {isDeckFullyMeasured} from '../redux/measurement/helpers';
import {BundleType} from '../../types/bundle';

// detects when we are going to have to wait for a bundle to be measured before we
// can set it as active and returns a shared value that will reflect that:
// - once we request a bundle change, if we'll need a measurement, we animate the shared value to 0
// - once the measurement is complete, we animate the shared value back to 1
export const useSharedDecksOpacity = () => {
  const sharedDecksOpacity = useSharedValue(1);

  const isBundleRequestedButNotFullyMeasured = useSelector(
    (state: RootState) => {
      const requestedBundleKey =
        state.requestedBundleChange.currentlyRequestedBundleKey;

      if (requestedBundleKey == null) {
        return false;
      }

      const bundle = state.bundles.bundles[requestedBundleKey];
      return !isDeckFullyMeasured({state, passages: bundle.passages});
    },
  );

  const [fadeState, setFadeState] = useState<{
    fadingOut: boolean;
    fadedOut: boolean;
  }>({fadingOut: false, fadedOut: false});

  const {fadingOut, fadedOut} = fadeState;

  const onFadedOut = () => {
    setFadeState({fadingOut: false, fadedOut: true});
  };

  useEffect(() => {
    if (isBundleRequestedButNotFullyMeasured && !fadingOut && !fadedOut) {
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
  }, [isBundleRequestedButNotFullyMeasured, fadingOut, fadedOut]);

  useEffect(() => {
    if (!isBundleRequestedButNotFullyMeasured && fadedOut) {
      setFadeState({fadingOut: false, fadedOut: false});
      sharedDecksOpacity.value = withTiming(1, {
        duration: 250,
      });
    }
  }, [isBundleRequestedButNotFullyMeasured, fadedOut]);

  return sharedDecksOpacity;
};

// gets the text to display when a deck is empty (in practice, generally raise an error because
// we currently don't expect decks other than likes to ever be empty)
export const getEmptyDeckText = ({bundle}: {bundle: BundleType}) => {
  const {bundleKey} = bundle;

  if (bundleKey === 'likes') {
    return "you haven't liked anything yet";
  } else {
    throw Error(`bundle ${bundleKey} should not be empty`);
  }
};
