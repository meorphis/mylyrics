// renders a carousel of passages; responsible for determining:
// - which passages have been loaded for this group
// - whether data is still loading or errored
// - which passage is currently active
// and then rendering the appropriate PassageItems accordingly
import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setActivePassage} from '../../utility/redux/active_passage';
import {RootState} from '../../utility/redux';
import _ from 'lodash';
import Icon from 'react-native-vector-icons/Ionicons';
import ThemedLoadingIndicator from './ThemedLoadingIndicator';
import {useUpdateSequentialWalkthroughStep} from '../../utility/walkthrough';
import PassageItemCarousel from '../passageItem/PassageItemCarousel';
import {PassageType} from '../../types/passage';
import ThemedPassageItem from '../passageItem/ThemedPassageItem';

type Props = {
  passageGroupKey: string;
};

type PassageCarouselItem = {
  passageKey: string;
  passage: PassageType;
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
  const {passageKey: activePassageKey} = useSelector(
    (state: RootState) => state.activePassage,
    // only recompute if the passage key has changed *and* this group is active
    (a, b) => a.passageKey === b.passageKey || b.groupKey !== passageGroupKey,
  )!;

  const dispatch = useDispatch();

  const updateSequentialWalkthroughStep = useUpdateSequentialWalkthroughStep();

  const data = passageGroupRequest.data;

  const isLoading = passageGroupRequest.status === 'loading';
  const isErrored = passageGroupRequest.status === 'error';

  const activeIndex = data.findIndex(
    item => item.passageKey === activePassageKey,
  );

  return (
    <View style={styles.container}>
      {data.length > 0 && (
        <PassageItemCarousel
          data={data}
          renderItem={({item}: {item: PassageCarouselItem; index: number}) => {
            return (
              <ThemedPassageItem
                passage={item.passage}
                passageIsActive={item.passageKey === activePassageKey}
              />
            );
          }}
          keyExtractor={(item: PassageCarouselItem, index: number) =>
            `${item.passageKey}:${index}`
          }
          firstItem={activeIndex}
          onBeforeSnapToItem={(slideIndex: number) => {
            dispatch(
              setActivePassage({
                passageKey: data[slideIndex].passageKey,
              }),
            );

            setTimeout(() => {
              updateSequentialWalkthroughStep();
            }, 250);
          }}
        />
      )}
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
