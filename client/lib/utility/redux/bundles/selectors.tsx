import {useSelector} from 'react-redux';
import {RootState} from '..';
import _ from 'lodash';

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

// gets all bundle keys grouped by the group names of their bundles
export const useGroupedBundleKeys = () => {
  return useSelector((state: RootState) => {
    const groups: {[key: string]: string[]} = {};

    Object.keys(state.bundles.bundles).forEach(bundleKey => {
      const bundle = state.bundles.bundles[bundleKey];
      const groupName = bundle.groupName;
      if (groupName) {
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(bundleKey);
      }
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
    return state.bundles.bundles[bundleKey].passages.some(
      p => p.passageKey === passageKey,
    );
  });
};

// returns an object containing some properties related to the thems of the
// active bundle and active passage - used to perform computations for the
// AnimatedThemeBackground component
export const useActiveBundleThemeInfo = () => {
  return useSelector(
    (state: RootState) => {
      const activeBundleKey = state.bundles.activeBundleKey;

      console.log(`active bundle key: ${activeBundleKey}`);

      const activePassageKey =
        state.bundles.bundleKeyToPassageKey[activeBundleKey];
      const activeBundle = state.bundles.bundles[activeBundleKey];
      const activePassageIndex = activeBundle.passages.findIndex(
        p => p.passageKey === activePassageKey,
      );
      const activeBundleIndex =
        state.requestedBundleChange.allRequestedBundleKeys.findIndex(
          bundleKey => bundleKey === activeBundleKey,
        );

      return {
        themes: state.requestedBundleChange.allRequestedBundleKeys.map(
          bundleKey =>
            state.bundles.bundles[bundleKey].passages.map(p => p.theme),
        ),
        activeBundleIndex,
        activePassageIndex,
      };
    },
    (prev, curr) => {
      return (
        prev.activeBundleIndex === curr.activeBundleIndex &&
        prev.activePassageIndex === curr.activePassageIndex
      );
    },
  );
};
