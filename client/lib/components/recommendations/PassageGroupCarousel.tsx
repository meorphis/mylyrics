// renders a carousel of passages; responsible for determining:
// - which passages have been loaded for this group
// - whether data is still loading or errored
// - which passage is currently active
// and then rendering the appropriate PassageItems accordingly

import React, {memo} from 'react';
import Carousel from '../../forks/react-native-snap-carousel';
import {Dimensions, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setActivePassage} from '../../utility/redux/active_passage';
import {RootState} from '../../utility/redux';
import _ from 'lodash';
import {PassageType} from '../../types/passage';
import ThemedPassageItem from './ThemedPassageItem';

// an item that can be rendered in the carousel - can be either a passage or a
// placeholder to indicate that more content is loading or that there was an
// error
type CarouselItemType =
  | {
      dataStatus: 'loaded';
      passageKey: string;
      passage: PassageType;
    }
  | {
      dataStatus: 'loading' | 'error';
      passageKey: undefined;
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

  // finagle the loaded passages into the format expected by the carousel items
  const data: CarouselItemType[] = passageGroupRequest.data.map(
    ({passageKey, passage}) => {
      return {
        dataStatus: 'loaded',
        passage,
        passageKey,
      };
    },
  );

  // if data is loading or errored, add a placeholder item to the carousel
  if (
    passageGroupRequest.status === 'loading' ||
    passageGroupRequest.status === 'init'
  ) {
    data.push({
      dataStatus: 'loading',
      passageKey: undefined,
    });
  } else if (passageGroupRequest.status === 'error') {
    data.push({
      dataStatus: 'error',
      passageKey: undefined,
    });
  }

  const dispatch = useDispatch();
  const activeIndex = data.findIndex(
    item => item.passageKey === activePassageKey,
  );

  return (
    <Carousel
      containerCustomStyle={styles.container}
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
      keyExtractor={(item: CarouselItemType, index: number) =>
        `${item.passageKey || item.dataStatus}:${index}`
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
      scrollEnabled={scrollEnabled}
      renderItem={({item}: {item: CarouselItemType; index: number}) => {
        return (
          <ThemedPassageItem
            passage={item.dataStatus === 'loaded' ? item.passage : null}
            passageItemKey={{
              groupKey: passageGroupKey,
              passageKey: item.passageKey || '',
            }}
          />
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
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
