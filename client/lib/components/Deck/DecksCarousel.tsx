import React, {memo, useEffect, useLayoutEffect, useRef} from 'react';
import {Dimensions} from 'react-native';
import NativeCarousel from '../../forks/react-native-reanimated-carousel/src';
import {SingletonLyricCard} from './SingletonLyricCard';
import _ from 'lodash';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import {useSharedDecksOpacity} from '../../utility/helpers/deck';
import {
  useActiveBundleKey,
  useAllBundleKeys,
} from '../../utility/redux/bundles/selectors';
import {useAllRequestedBundleKeys} from '../../utility/redux/requested_bundle_change/selectors';
import Deck from './Deck';

const Carousel = memo(NativeCarousel, (prev, next) => {
  return _.isEqual(prev.data, next.data);
});

// renders a carousel of Decks (which are themselves carousels of LyricCards)
// responsible for responding to changes to some state changes in the bundles
const DeckCarousel = () => {
  console.log('rendering DeckCarousel');

  const allBundleKeys = useAllBundleKeys();
  const activeBundleKey = useActiveBundleKey();
  const selectedGroupOpacity = useSharedDecksOpacity();
  const allRequestedBundleKeys = new Set(useAllRequestedBundleKeys());

  // to reduce up front computation, only render decks once their bundles have
  // been requested
  const visibleBundleKeys = allBundleKeys.filter(bundleKey => {
    const isVisible = allRequestedBundleKeys.has(bundleKey);
    return isVisible ? bundleKey : null;
  });

  const [data, setData] = React.useState<string[]>(visibleBundleKeys);

  useEffect(() => {
    setData((prevData: string[]) => {
      const newData = [...prevData];
      visibleBundleKeys.forEach(bundleKey => {
        if (!newData.includes(bundleKey)) {
          newData.push(bundleKey);
        }
      });

      return newData;
    });
  }, [visibleBundleKeys.sort().join(',')]);

  // @ts-ignore
  const carouselRef = useRef<Carousel>(null);

  // scroll to the active bundle when it changes
  const activeIndex = data.findIndex(groupKey => groupKey === activeBundleKey);
  useLayoutEffect(() => {
    if (carouselRef.current?.getCurrentIndex() !== activeIndex) {
      carouselRef.current?.scrollTo({
        index: activeIndex,
        animated: true,
      });
    }
  }, [activeIndex]);

  // we sometimes reduce the opacity if a bundle has been requested but is not
  // ready to be shown yet (see useSharedDecksOpacity implementation)
  const style = useAnimatedStyle(() => {
    return {
      opacity: selectedGroupOpacity.value,
    };
  });

  return (
    <Animated.View style={style}>
      <Carousel
        ref={carouselRef}
        data={data}
        loop={false}
        width={Dimensions.get('window').width}
        height={Dimensions.get('window').height}
        enabled={false}
        // keyExtractor={(item: unknown, idx: number) =>
        //   'carousel-item-' + (item as string) + `-${idx}`
        // }
        renderItem={({item: bundleKey}: {item: unknown}) => {
          if (bundleKey === null) {
            return <React.Fragment />;
          }
          if (bundleKey === 'singleton_passage') {
            return <SingletonLyricCard key={bundleKey as string} />;
          }
          return (
            <Deck key={bundleKey as string} bundleKey={bundleKey as string} />
          );
        }}
      />
    </Animated.View>
  );
};

export default DeckCarousel;
