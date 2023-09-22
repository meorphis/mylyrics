// renders a carousel of nested carousels (PassageGroupCarousels)
// responsible for listening to changes to the list of groups and active group,
// and updating the carousel accordingly

import React, {memo, useLayoutEffect, useRef} from 'react';
import {Dimensions} from 'react-native';
import NativeCarousel from '../../forks/react-native-reanimated-carousel/src';
import {RootState} from '../../utility/redux';
import {useSelector} from 'react-redux';
import RecommendationsGroupCarousel from './RecommendationsGroupCarousel';
import {createSelector} from '@reduxjs/toolkit';
import LikesCarousel from './LikesCarousel';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SingletonPassageItem} from '../passageItem/SingletonPassageItem';

const Carousel = memo(NativeCarousel, () => true);

type Props = {
  activeGroupKey: string | null;
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

  const passageGroupKeys = [
    ...useSelector(passageGroupKeysSelector),
    'likes',
    'singleton_passage',
  ];

  // const [localActiveGroupKey, setLocalActiveGroupKey] =
  //   React.useState<string>(activeGroupKey);

  // @ts-ignore
  const carouselRef = useRef<Carousel>(null);
  const insets = useSafeAreaInsets();

  const activeIndex = passageGroupKeys.findIndex(
    groupKey => groupKey === activeGroupKey,
  );

  // useLayoutEffect(() => {
  //   if (localActiveGroupKey !== activeGroupKey) {
  //     // user has selected a new group
  //     const localIndex = passageGroupKeys.findIndex(
  //       groupKey => groupKey === localActiveGroupKey,
  //     );

  //     // new content has loaded in front of the current index
  //     if (localIndex !== carouselRef.current?.currentIndex) {
  //       carouselRef.current?.snapToItem(localIndex, false, false, true, () => {
  //         carouselRef.current?.snapToItem(activeIndex, true, false, false);
  //       });
  //     } else {
  //       carouselRef.current?.snapToItem(activeIndex, true, false, true);
  //     }
  //     setLocalActiveGroupKey(activeGroupKey);
  //   } else if (carouselRef.current?.currentIndex !== activeIndex) {
  //     // new content has loaded in front of the current index
  //     carouselRef.current?.snapToItem(activeIndex, false, false, true);
  //   }
  // }, [carouselRef.current?.currentIndex, activeIndex]);

  useLayoutEffect(() => {
    if (carouselRef.current?.getCurrentIndex() !== activeIndex) {
      carouselRef.current?.scrollTo({
        index: activeIndex,
        animated: true,
      });
    }
  }, [activeIndex]);

  console.log(
    'layout',
    Dimensions.get('window').height,
    insets.top,
    insets.bottom,
  );

  return (
    <Carousel
      // other props
      ref={carouselRef}
      data={passageGroupKeys}
      loop={false}
      // itemWidth={Dimensions.get('window').width}
      // sliderWidth={Dimensions.get('window').width}
      width={Dimensions.get('window').width}
      height={Dimensions.get('window').height}
      enabled={false}
      // keyExtractor={(item: string) => 'carousel-item-' + item}
      renderItem={({item: passageGroupKey}: {item: unknown}) => {
        if (passageGroupKey === 'likes') {
          return <LikesCarousel />;
        } else if (passageGroupKey === 'singleton_passage') {
          return <SingletonPassageItem />;
        }
        return (
          <RecommendationsGroupCarousel
            key={passageGroupKey as string}
            passageGroupKey={passageGroupKey as string}
          />
        );
      }}
    />
  );
};

export default RecommendationsCarousel;
