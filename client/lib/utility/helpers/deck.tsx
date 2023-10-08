import {useDispatch, useSelector} from 'react-redux';
import {useEffect, useState} from 'react';
import {runOnJS, useSharedValue, withTiming} from 'react-native-reanimated';
import {RootState} from '../redux';
import {isDeckFullyMeasured} from '../redux/measurement/helpers';
import {BundleType, UnhydratedBundlePassageType} from '../../types/bundle';
import _ from 'lodash';
import {hydratePassage} from './passage';
import {addHydratedPassagesToBundle} from '../redux/bundles/slice';

// detects when we are going to have to wait for a bundle to be hydrated and/or measured before we
// can set it as active and (a) hydrates it if necessary and (b) returns a shared value that will
// reflect the readiness of the bundle to be set as active:
// - once we request a bundle change, if we need hydration/measurement, we animate the shared value to 0
// - once the hydration/measurement is complete, we animate the shared value back to 1
export const useSharedDecksTransition = () => {
  const dispatch = useDispatch();

  const sharedDecksOpacity = useSharedValue(1);

  const pendingBundleInfo = useSelector((state: RootState) => {
    const requestedBundleKey =
      state.requestedBundleChange.currentlyRequestedBundleKey;

    if (requestedBundleKey == null) {
      return null;
    }

    const bundle = state.bundles.bundles[requestedBundleKey];

    if (!bundle.passages.hydrated) {
      return {
        requestedBundleKey,
        unhydratedPassages: bundle.passages.data,
        measured: false,
      };
    }

    if (!isDeckFullyMeasured({state, passages: bundle.passages})) {
      return {
        requestedBundleKey,
        unhydratedPassages: null,
        measured: false,
      };
    }

    return null;
  }, _.isEqual);

  useEffect(() => {
    const hydratePassages = async ({
      bundleKey,
      unhydratedPassages,
    }: {
      bundleKey: string;
      unhydratedPassages: UnhydratedBundlePassageType[];
    }) => {
      const hydratedPassages = await Promise.all(
        unhydratedPassages.map(hydratePassage),
      );
      dispatch(
        addHydratedPassagesToBundle({
          bundleKey,
          passages: hydratedPassages,
        }),
      );
    };

    if (pendingBundleInfo && pendingBundleInfo.unhydratedPassages) {
      hydratePassages({
        bundleKey: pendingBundleInfo.requestedBundleKey,
        unhydratedPassages: pendingBundleInfo.unhydratedPassages,
      });
    }
  }, [Boolean(pendingBundleInfo?.unhydratedPassages)]);

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
      pendingBundleInfo &&
      !pendingBundleInfo.measured &&
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
  }, [pendingBundleInfo?.measured, fadingOut, fadedOut]);

  useEffect(() => {
    if (!pendingBundleInfo && fadedOut) {
      setFadeState({fadingOut: false, fadedOut: false});
      sharedDecksOpacity.value = withTiming(1, {
        duration: 250,
      });
    }
  }, [Boolean(pendingBundleInfo), fadedOut]);

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
