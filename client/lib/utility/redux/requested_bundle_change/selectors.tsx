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
