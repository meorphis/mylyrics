// renders a carousel of passages; responsible for determining:
// - which passages have been loaded for this group
// - whether data is still loading or errored
// - which passage is currently active
// and then rendering the appropriate PassageItems accordingly

import React from 'react';
import Carousel from 'react-native-snap-carousel';
import PassageItem from './PassageItem';
import {StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setActivePassage} from '../utility/redux/active_passage';
import {RootState} from '../utility/redux';
import _ from 'lodash';
import PassageItemContainer from './PassageItemContainer';
import {PassageType} from '../types/passage';
import NonLoadedPassageItem from './NonLoadedPassageItem';

// an item that can be rendered in the carousel - can be either a passage or a
// placeholder to indicate that more content is loading or that there was an
// error
type CarouselItemType = {
  passageIsActive: boolean;
} & (
  | {
      dataStatus: 'loaded';
      passageKey: string;
      passage: PassageType;
    }
  | {
      dataStatus: 'loading' | 'error';
      passageKey: undefined;
    }
);

type Props = {
  passageGroupKey: string;
};

const PassageGroupCarousel = (props: Props) => {
  const {passageGroupKey} = props;

  // get all of the passages to show in this carousel
  const passageGroup = useSelector(
    (state: RootState) => state.recommendations[passageGroupKey],
    _.isEqual,
  );

  // and figure out which one is active
  const activePassageKey = useSelector((state: RootState) =>
    // a passage item cannot be considered active if its group isn't active
    state.activePassage != null &&
    state.activePassage.groupKey === passageGroupKey
      ? state.activePassage.passageKey
      : null,
  )!;

  // finagle the loaded passages into the format expected by the carousel items
  const data: CarouselItemType[] = Object.entries(passageGroup.data).map(
    ([passageKey, passage]) => {
      return {
        dataStatus: 'loaded',
        passage,
        passageKey,
        passageIsActive: passageKey === activePassageKey,
      };
    },
  );

  // if data is loading or errored, add a placeholder item to the carousel
  if (passageGroup.status === 'loading') {
    data.push({
      dataStatus: 'loading',
      passageIsActive: activePassageKey == null,
      passageKey: undefined,
    });
  } else if (passageGroup.status === 'error') {
    data.push({
      dataStatus: 'error',
      passageIsActive: activePassageKey == null,
      passageKey: undefined,
    });
  }

  const dispatch = useDispatch();
  const activeIndex = data.findIndex(item => item.passageIsActive);

  return (
    <Carousel
      containerCustomStyle={styles.container}
      contentContainerCustomStyle={styles.contentContainer}
      slideStyle={styles.slideStyle}
      loop
      data={data}
      itemHeight={500}
      sliderHeight={600}
      layout="stack"
      vertical
      firstItem={activeIndex}
      onBeforeSnapToItem={slideIndex =>
        dispatch(
          setActivePassage({
            passageKey: data[slideIndex].passageKey,
          }),
        )
      }
      renderItem={({item}) => {
        return (
          <PassageItemContainer>
            {item.dataStatus === 'loaded' ? (
              <PassageItem
                key={`${passageGroupKey}:${item.passageKey}`}
                passage={item.passage}
                passageIsActive={item.passageIsActive}
                passageKey={item.passageKey}
              />
            ) : (
              <NonLoadedPassageItem
                key={`${passageGroupKey}:nonloaded`}
                dataStatus={item.dataStatus}
              />
            )}
          </PassageItemContainer>
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

export default PassageGroupCarousel;
