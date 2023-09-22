// renders a carousel of passages; responsible for determining:
// - which passages have been loaded for this group
// - whether data is still loading or errored
// - which passage is currently active
// and then rendering the appropriate PassageItems accordingly
import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import _ from 'lodash';
import ThemedLoadingIndicator from './ThemedLoadingIndicator';
import PassageItemCarousel from '../passageItem/PassageItemCarousel';
import ErrorComponent from '../common/ErrorComponent';

type Props = {
  passageGroupKey: string;
};

const RecommendationsGroupCarousel = (props: Props) => {
  console.log(
    `rendering RecommendationsGroupCarousel ${props.passageGroupKey}`,
  );

  const {passageGroupKey} = props;

  // get all of the passages to show in this carousel
  const passageGroupRequest = useSelector(
    (state: RootState) =>
      state.recommendations.find(({groupKey}) => groupKey === passageGroupKey)!
        .passageGroupRequest,
    _.isEqual,
  )!;

  // and figure out which one is active
  // const activePassageKey = useSelector((state: RootState) =>
  //   state.activePassage.groupKey === passageGroupKey
  //     ? state.activePassage.passageKey
  //     : null,
  // )!;

  const data = passageGroupRequest.data;

  const isLoading = passageGroupRequest.status === 'loading';
  const isErrored = passageGroupRequest.status === 'error';

  // const activeIndex = data.findIndex(
  //   item => item.passageKey === activePassageKey,
  // );

  return (
    <View style={styles.container}>
      {data.length > 0 && (
        <PassageItemCarousel groupKey={passageGroupKey} data={data} />
      )}
      {isLoading && (
        <ThemedLoadingIndicator
          noun={`${data.length > 0 ? 'more' : passageGroupKey} passages`}
        />
      )}
      {isErrored && <ErrorComponent />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default memo(RecommendationsGroupCarousel, () => {
  return true;
});
