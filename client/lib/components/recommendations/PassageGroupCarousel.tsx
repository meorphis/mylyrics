// renders a carousel of passages; responsible for determining:
// - which passages have been loaded for this group
// - whether data is still loading or errored
// - which passage is currently active
// and then rendering the appropriate PassageItems accordingly
import React, {memo} from 'react';
import Carousel from '../../forks/react-native-snap-carousel';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setActivePassage} from '../../utility/redux/active_passage';
import {RootState} from '../../utility/redux';
import _ from 'lodash';
import ThemedPassageItem from './ThemedPassageItem';
import {RawPassageType} from '../../types/passage';
import Icon from 'react-native-vector-icons/Ionicons';

type PassageGroupItem = {
  passageKey: string;
  passage: RawPassageType;
};

type Props = {
  passageGroupKey: string;
};

const PassageGroupCarousel = (props: Props) => {
  console.log(`rendering PassageGroupCarousel ${props.passageGroupKey}`);

  const {passageGroupKey} = props;
  const [scrollEnabled, setScrollEnabled] = React.useState(true);

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

  const data = passageGroupRequest.data;

  const isLoading = passageGroupRequest.status === 'loading';
  const isErrored = passageGroupRequest.status === 'error';

  const activeIndex = data.findIndex(
    item => item.passageKey === activePassageKey,
  );

  return (
    <View style={styles.container}>
      <Carousel
        containerCustomStyle={styles.carouselContainer}
        contentContainerCustomStyle={styles.contentContainer}
        slideStyle={styles.slideStyle}
        loop
        loopClonesPerSide={2}
        data={data}
        itemHeight={Dimensions.get('window').height * 0.8}
        sliderHeight={Dimensions.get('window').height * 0.85}
        layout="stack"
        vertical
        activeAnimationType="decay"
        firstItem={activeIndex}
        keyExtractor={(item: PassageGroupItem, index: number) =>
          `${item.passageKey}:${index}`
        }
        onBeforeSnapToItem={(slideIndex: number) => {
          dispatch(
            setActivePassage({
              passageKey: data[slideIndex].passageKey,
            }),
          );

          // prevent unnecessarily fast scrolling due to performance limitations
          setScrollEnabled(false);
          setTimeout(() => {
            setScrollEnabled(true);
          }, 250);
        }}
        scrollEnabled={
          scrollEnabled && ((!isLoading && !isErrored) || data.length > 1)
        }
        renderItem={({item}: {item: PassageGroupItem; index: number}) => {
          return (
            <ThemedPassageItem
              passage={item.passage}
              passageItemKey={{
                groupKey: passageGroupKey,
                passageKey: item.passageKey || '',
              }}
            />
          );
        }}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>loading more passages…</Text>
        </View>
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
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: 'darkgrey',
  },
  errorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 4,
    color: 'darkred',
  },
  carouselContainer: {
    marginHorizontal: 24,
  },
  contentContainer: {},
  slideStyle: {
    borderRadius: 10,
  },
});

export default memo(PassageGroupCarousel, () => {
  return true;
});
