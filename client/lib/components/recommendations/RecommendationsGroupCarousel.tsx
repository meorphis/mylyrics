// renders a carousel of passages; responsible for determining:
// - which passages have been loaded for this group
// - whether data is still loading or errored
// - which passage is currently active
// and then rendering the appropriate PassageItems accordingly
import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import _ from 'lodash';
import Icon from 'react-native-vector-icons/Ionicons';
import ThemedLoadingIndicator from './ThemedLoadingIndicator';
import PassageItemCarousel from '../passageItem/PassageItemCarousel';

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
      {data.length > 0 && <PassageItemCarousel data={data} />}
      {isLoading && (
        <ThemedLoadingIndicator
          noun={`${data.length > 0 ? 'more' : passageGroupKey} passages`}
        />
      )}
      {isErrored && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={24} color="darkred" />
          <Text style={styles.errorText}>an error occurred</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    marginLeft: 4,
    color: 'darkred',
  },
});

export default memo(RecommendationsGroupCarousel, () => {
  return true;
});
