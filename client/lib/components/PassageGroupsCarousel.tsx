// renders a carousel of nested carousels (PassageGroupCarousels)
// responsible for listening to changes to the list of groups and active group,
// and updating the carousel accordingly

import React, {useEffect, useRef} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet} from 'react-native';
import Carousel from 'react-native-snap-carousel';
import {RootState} from '../utility/redux';
import {useSelector} from 'react-redux';
import PassageGroupCarousel from './PassageGroupCarousel';
import {createSelector} from '@reduxjs/toolkit';

const PassageGroupsCarousel = () => {
  // create a selector with an input selector that transforms the group keys into a
  // string, so that we do not re-render the carousel when the group keys remain the
  // same
  const passageGroupKeysSelector = createSelector(
    [(state: RootState) => Object.keys(state.recommendations).sort().join(',')],
    (joinedGroupKeys: string) => joinedGroupKeys.split(','),
  );

  const passageGroupKeys = useSelector(passageGroupKeysSelector);
  const activeGroupKey = useSelector(
    (state: RootState) => state.activePassage?.groupKey,
  );

  const carouselRef = useRef<Carousel<string>>(null);

  const activeIndex = passageGroupKeys.findIndex(
    groupKey => groupKey === activeGroupKey,
  );

  useEffect(() => {
    if (activeIndex > -1 && carouselRef.current) {
      if (carouselRef.current.currentIndex !== activeIndex) {
        carouselRef.current.snapToItem(activeIndex, true);
      }
    }
  }, [activeIndex]);

  return (
    <SafeAreaView style={styles.safearea}>
      <Carousel
        // other props
        ref={carouselRef}
        data={passageGroupKeys}
        itemWidth={400}
        sliderWidth={400}
        loop
        loopClonesPerSide={1}
        useScrollView
        scrollEnabled={false}
        renderItem={({item: passageGroupKey}) => {
          return (
            <PassageGroupCarousel
              key={passageGroupKey}
              passageGroupKey={passageGroupKey}
            />
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
  },
});

export default PassageGroupsCarousel;
