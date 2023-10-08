import React, {memo, useLayoutEffect, useRef} from 'react';
import {Dimensions} from 'react-native';
import NativeCarousel from '../../forks/react-native-reanimated-carousel/src';
import {SingletonLyricCard} from './SingletonLyricCard';
import _ from 'lodash';
import Animated, {Easing, useAnimatedStyle} from 'react-native-reanimated';
import {useSharedDecksTransition} from '../../utility/helpers/deck';
import {useScrollToBundleIndex} from '../../utility/redux/bundles/selectors';
import {useAllRequestedBundleKeys} from '../../utility/redux/requested_bundle_change/selectors';
import Deck from './Deck';
import {useThemeProgress} from '../../utility/contexts/theme_animation';

const Carousel = memo(NativeCarousel, (prev, next) => {
  return _.isEqual(prev.data, next.data);
});

// renders a carousel of Decks (which are themselves carousels of LyricCards)
// responsible for responding to changes to some state changes in the bundles
const DecksCarousel = () => {
  console.log('rendering DeckCarousel');

  const scrollToBundleIndex = useScrollToBundleIndex();
  const selectedGroupOpacity = useSharedDecksTransition();

  // to reduce up front computation, only render decks once their bundles have
  // been requested
  const allRequestedBundleKeys = useAllRequestedBundleKeys();
  const {sharedDecksCarouselProgress} = useThemeProgress();

  // @ts-ignore
  const carouselRef = useRef<Carousel>(null);

  useLayoutEffect(() => {
    if (carouselRef.current?.getCurrentIndex() !== scrollToBundleIndex) {
      carouselRef.current?.scrollTo({
        index: scrollToBundleIndex,
        animated: true,
      });
    }
  }, [scrollToBundleIndex]);

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
        data={allRequestedBundleKeys}
        loop={false}
        width={Dimensions.get('window').width}
        height={Dimensions.get('window').height}
        enabled={false}
        scrollAnimationDuration={750}
        withAnimation={{
          type: 'timing',
          config: {
            easing: Easing.inOut(Easing.quad),
          },
        }}
        keyExtractor={(item: unknown) => 'carousel-item-' + (item as string)}
        onProgressChange={(__, absoluteProgress: number) => {
          'worklet';
          sharedDecksCarouselProgress.value = absoluteProgress;
        }}
        renderItem={({item: bundleKey}: {item: unknown}) => {
          if (bundleKey === null) {
            return <React.Fragment />;
          }
          if (bundleKey === 'singleton') {
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

export default DecksCarousel;
