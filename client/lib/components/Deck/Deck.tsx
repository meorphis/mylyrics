import React, {memo, useEffect} from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import Carousel from '../../forks/react-native-reanimated-carousel/src';
import {WithSharedTransitionKey} from '../LyricCard/hoc/WithSharedTransitionKey';
import LyricCard from '../LyricCard/LyricCard';
import {
  useBundle,
  useIsActiveBundle,
} from '../../utility/redux/bundles/selectors';
import {useCommonSharedValues} from '../../utility/contexts/common_shared_values';
import {useLyricCardSize} from '../../utility/helpers/lyric_card';
import {useDispatch} from 'react-redux';
import {setActiveBundlePassage} from '../../utility/redux/bundles/slice';
import {BundlePassageType} from '../../types/bundle';
import {getEmptyDeckText} from '../../utility/helpers/deck';
import {useSharedValue} from 'react-native-reanimated';

const PassageItemComponent = memo(
  WithSharedTransitionKey(LyricCard),
  () => true,
);

type Props = {
  bundleKey: string;
};

// renders a carousel of LyricCards; responsible for setting the active passage in
// redux when the user scrolls among the cards
const Deck = (props: Props) => {
  console.log(`rendering Deck for bundle: ${props.bundleKey}`);

  const {bundleKey} = props;
  const bundle = useBundle({bundleKey});
  const {passages} = bundle;

  const dispatch = useDispatch();
  const {sharedDeckProgress} = useCommonSharedValues();
  const {
    marginTop,
    marginHorizontal,
    height: passageItemHeight,
    carouselClearance,
  } = useLyricCardSize();

  const isActiveBundle = useIsActiveBundle(bundleKey);
  const sharedIsActiveBundle = useSharedValue(isActiveBundle);
  useEffect(() => {
    sharedIsActiveBundle.value = isActiveBundle;
  }, [isActiveBundle]);

  // @ts-ignore
  const ref = React.useRef<NativeCarousel>(null);

  // if a passage is removed from the bundle, continue to show and trigger a scroll,
  // removing it only after it has scrolled out of view
  const [passagesCache, setPassagesCache] =
    React.useState<BundlePassageType[]>(passages);
  useEffect(() => {
    if (passages.length !== passagesCache.length) {
      ref.current?.scrollTo({
        animated: true,
        count: 1,
        onFinished: () => setPassagesCache(passages),
      });
    }
  }, [passages.length]);

  if (passages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{getEmptyDeckText({bundle})}</Text>
      </View>
    );
  }

  return (
    <Carousel
      ref={ref}
      style={{...styles.carouselContainer}}
      loop
      data={passagesCache}
      height={passageItemHeight + carouselClearance}
      width={Dimensions.get('window').width}
      vertical
      mode="vertical-stack"
      modeConfig={{
        stackInterval: 30,
        scaleInterval: 0.04,
        opacityInterval: 0.3,
        rotateZDeg: 90,
        moveSize: Dimensions.get('window').width * 1.5,
      }}
      onProgressChange={(__, absoluteProgress: number) => {
        'worklet';
        if (sharedIsActiveBundle.value) {
          sharedDeckProgress.value = absoluteProgress;
        }
      }}
      onSnapToItem={(slideIndex: number) => {
        const item = passagesCache[slideIndex];

        if (isActiveBundle) {
          dispatch(setActiveBundlePassage(item));
        }
      }}
      renderItem={({item}: {item: unknown}) => {
        return (
          <PassageItemComponent
            passage={item as BundlePassageType}
            measurementContext="MAIN_SCREEN"
            style={{marginTop, marginHorizontal}}
          />
        );
      }}
      keyExtractor={(item: unknown) =>
        `${(item as BundlePassageType).passageKey}-${bundleKey}`
      }
      snapEnabled={false}
      autoFillData={false}
    />
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    alignSelf: 'center',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    marginLeft: 4,
    color: 'black',
  },
});

export default Deck;
