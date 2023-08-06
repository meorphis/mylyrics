// renders a carousel of nested carousels (PassageGroupCarousels)
// responsible for listening to changes to the list of groups and active group,
// and updating the carousel accordingly

import React, {useLayoutEffect, useRef} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, Dimensions} from 'react-native';
import Carousel from '../../forks/react-native-snap-carousel';
import {RootState} from '../../utility/redux';
import {useSelector} from 'react-redux';
import PassageGroupCarousel from './PassageGroupCarousel';
import {createSelector} from '@reduxjs/toolkit';

const PassageGroupsCarousel = () => {
  console.log('rendering PassageGroupsCarousel');

  // create a selector with an input selector that transforms the group keys into a
  // string, so that we do not re-render the carousel when the group keys remain the
  // same
  const passageGroupKeysSelector = createSelector(
    [
      (state: RootState) =>
        state.recommendations.map(r => r.groupKey).join(','),
    ],
    (joinedGroupKeys: string) => joinedGroupKeys.split(','),
  );

  const passageGroupKeys = useSelector(passageGroupKeysSelector);
  const activeGroupKey = useSelector(
    (state: RootState) => state.activePassage?.groupKey,
  );

  const [localActiveGroupKey, setLocalActiveGroupKey] =
    React.useState<string>(activeGroupKey);

  const carouselRef = useRef<Carousel>(null);

  const activeIndex = passageGroupKeys.findIndex(
    groupKey => groupKey === activeGroupKey,
  );

  useLayoutEffect(() => {
    if (localActiveGroupKey !== activeGroupKey) {
      // user has selected a new group
      const localIndex = passageGroupKeys.findIndex(
        groupKey => groupKey === localActiveGroupKey,
      );

      // new content has loaded in front of the current index
      if (localIndex !== carouselRef.current?.currentIndex) {
        carouselRef.current?.snapToItem(localIndex, false, false, true, () => {
          carouselRef.current?.snapToItem(activeIndex, true, false, false);
        });
      } else {
        carouselRef.current?.snapToItem(activeIndex, true, false, true);
      }
      setLocalActiveGroupKey(activeGroupKey);
    } else if (carouselRef.current?.currentIndex !== activeIndex) {
      // new content has loaded in front of the current index
      carouselRef.current?.snapToItem(activeIndex, false, false, true);
    }
  }, [carouselRef.current?.currentIndex, activeIndex]);

  return (
    <SafeAreaView style={styles.safearea}>
      <Carousel
        // other props
        ref={carouselRef}
        data={passageGroupKeys}
        itemWidth={Dimensions.get('window').width}
        sliderWidth={Dimensions.get('window').width}
        scrollEnabled={false}
        useScrollView
        keyExtractor={(item: string) => 'carousel-item-' + item}
        renderItem={({item: passageGroupKey}: {item: string}) => {
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
