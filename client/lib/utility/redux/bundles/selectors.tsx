import {useSelector} from 'react-redux';
import {RootState} from '..';
import _ from 'lodash';
import {
  BundleInfo,
  BundlePassageType,
  UnhydratedBundlePassageType,
} from '../../../types/bundle';

// gets all of the passages in a bundle
export const useBundle = ({bundleKey}: {bundleKey: string}) => {
  const bundle = useSelector(
    (state: RootState) => state.bundles.bundles[bundleKey],
    _.isEqual,
  );
  if (!bundle) {
    throw Error(`bundle ${bundleKey} does not exist in state`);
  }
  return bundle;
};

// gets all bundle keys in state
export const useAllBundleKeys = () => {
  return useSelector((state: RootState) => {
    return Object.keys(state.bundles.bundles);
  }, _.isEqual);
};

// gets all bundle infos grouped by the group names of their bundles
export const useGroupedBundleInfos = () => {
  return useSelector((state: RootState) => {
    const groups: {[key: string]: BundleInfo[]} = {};

    Object.values(state.bundles.bundles).forEach(bundle => {
      if (!bundle.info.group) {
        return;
      }

      const group = bundle.info.group;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(bundle.info);
    });

    return groups;
  }, _.isEqual);
};

// returns the bundle key that is currently active
export const useActiveBundleKey = () => {
  const bundleKey = useSelector((state: RootState) => {
    return state.bundles.activeBundleKey;
  });

  return bundleKey;
};

// returns the bundle object that is currently active
export const useActiveBundle = () => {
  return useSelector((state: RootState) => {
    return state.bundles.bundles[state.bundles.activeBundleKey];
  });
};

export const useActivePassageKeyForBundle = ({
  bundleKey,
}: {
  bundleKey: string;
}) => {
  const passageKey = useSelector((state: RootState) => {
    return state.bundles.bundleKeyToPassageKey[bundleKey];
  });

  return passageKey;
};

// returns the index of the bundle that the desk carousel should be scrolled to
export const useScrollToBundleIndex = () => {
  const bundleKey = useSelector((state: RootState) => {
    return state.bundles.scrollToBundleIndex;
  });

  return bundleKey;
};

// returns the bundle key that was active before the current one
export const usePreviouslyActiveBundleKey = () => {
  const bundleKey = useSelector((state: RootState) => {
    return state.bundles.previousActiveBundleKey;
  });

  return bundleKey;
};

// returns a boolean indicating whether a given bundle key is active
export const useIsActiveBundle = (bundleKey: string) => {
  return useSelector((state: RootState) => {
    return state.bundles.activeBundleKey === bundleKey;
  });
};

// returns a boolean indicating whether a given bundle key and passage key are
// active
export const useIsActiveBundlePassage = ({
  bundleKey,
  passageKey,
}: {
  bundleKey: string;
  passageKey: string;
}) => {
  return useSelector((state: RootState) => {
    return (
      state.bundles.activeBundleKey === bundleKey &&
      state.bundles.bundleKeyToPassageKey[bundleKey] === passageKey
    );
  });
};

// returns a boolean indicating whether a given passage key is included in the
// given bundle
export const useBundleIncludesPassage = ({
  bundleKey,
  passageKey,
}: {
  bundleKey: string;
  passageKey: string;
}) => {
  return useSelector((state: RootState) => {
    const bundle = state.bundles.bundles[bundleKey];
    return (
      bundle && bundle.passages.data.some(p => p.passageKey === passageKey)
    );
  });
};

// returns an object containing some properties related to the thems of the
// active bundle and active passage - used to perform computations for the
// AnimatedThemeBackground component
export const useActiveBundleThemeInfo = () => {
  return useSelector((state: RootState) => {
    const activeBundleKey = state.bundles.activeBundleKey;
    const activePassageKey =
      state.bundles.bundleKeyToPassageKey[activeBundleKey];

    const activeBundle = state.bundles.bundles[activeBundleKey];
    const activePassageIndex = activePassageKey
      ? activeBundle.passages.data.findIndex(
          p => p.passageKey === activePassageKey,
        )
      : 0;
    const activeBundleIndex =
      state.requestedBundleChange.allRequestedBundleKeys.findIndex(
        bundleKey => bundleKey === activeBundleKey,
      );

    return {
      themes: state.requestedBundleChange.allRequestedBundleKeys.map(
        bundleKey => {
          const passages = state.bundles.bundles[bundleKey].passages;
          return passages.data.length > 0
            ? passages.data.map(
                (p: BundlePassageType | UnhydratedBundlePassageType) => p.theme,
              )
            : [null];
        },
      ),
      activeBundleIndex,
      activePassageIndex,
    };
  }, _.isEqual);
};
