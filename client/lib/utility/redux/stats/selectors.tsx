import {useSelector} from 'react-redux';
import {RootState} from '..';
import _ from 'lodash';

export const useTopSentiments = () => {
  return useSelector(
    (state: RootState) => state.stats.topSentiments,
    _.isEqual,
  );
};

export const useHasTopSentiments = () => {
  return useSelector((state: RootState) =>
    Object.values(state.stats.topSentiments || {}).some(s => s != null),
  );
};
