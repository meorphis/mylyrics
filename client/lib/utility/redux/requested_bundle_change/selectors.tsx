import {useSelector} from 'react-redux';
import {RootState} from '..';
import _ from 'lodash';

export const useAllRequestedBundleKeys = () => {
  return useSelector(
    (state: RootState) => state.requestedBundleChange.allRequestedBundleKeys,
    _.isEqual,
  );
};

export const useAllRequestedBundles = () => {
  return useSelector(
    (state: RootState) =>
      state.requestedBundleChange.allRequestedBundleKeys.map(
        bundleKey => state.bundles.bundles[bundleKey],
      ),
    _.isEqual,
  );
};

export const useIsOnlyUserMadeRequested = () => {
  return useSelector(
    (state: RootState) =>
      state.requestedBundleChange.allRequestedBundleKeys.every(
        bundleKey => state.bundles.bundles[bundleKey].info.type === 'user_made',
      ),
    _.isEqual,
  );
};
