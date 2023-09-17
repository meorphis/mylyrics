// renders a carousel of nested carousels (PassageGroupCarousels)
// responsible for listening to changes to the list of groups and active group,
// and updating the carousel accordingly

import React, {useLayoutEffect, useRef} from 'react';
import {Dimensions} from 'react-native';
import Carousel from '../../forks/react-native-snap-carousel/src';
import {RootState} from '../../utility/redux';
import {useSelector} from 'react-redux';
import RecommendationsGroupCarousel from './RecommendationsGroupCarousel';
import {createSelector} from '@reduxjs/toolkit';
import LikesCarousel from './LikesCarousel';

type Props = {
  activeGroupKey: string;
};

const RecommendationsCarousel = (props: Props) => {
  console.log('rendering RecommendationsCarousel');

  const {activeGroupKey} = props;

  // create a selector with an input selector that transforms the group keys into a
  // string, so that we do not re-render the carousel when the group keys remain the
  // same
  const passageGroupKeysSelector = createSelector(
    [
      (state: RootState) =>
        state.recommendations
          .filter(r => r.passageGroupRequest.status !== 'init')
          .map(r => r.groupKey)
          .join(','),
    ],
    (joinedGroupKeys: string) => joinedGroupKeys.split(','),
  );

  const passageGroupKeys = [...useSelector(passageGroupKeysSelector), 'likes'];

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
        if (passageGroupKey === 'likes') {
          return <LikesCarousel />;
        }
        return (
          <RecommendationsGroupCarousel
            key={passageGroupKey}
            passageGroupKey={passageGroupKey}
          />
        );
      }}
    />
  );
};

export default RecommendationsCarousel;
