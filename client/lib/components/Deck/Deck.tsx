import React, {memo, useEffect} from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import Carousel from '../../forks/react-native-reanimated-carousel/src';
import {WithSharedTransitionKey} from '../LyricCard/hoc/WithSharedTransitionKey';
import { FlippableLyricCard}  from '../LyricCard/LyricCard';
import {
  useActivePassageKeyForBundle,
  useBundle,
  useIsActiveBundle,
} from '../../utility/redux/bundles/selectors';
import {useThemeProgress} from '../../utility/contexts/theme_animation';
import {useLyricCardSize} from '../../utility/helpers/lyric_card';
import {useDispatch} from 'react-redux';
import {setActiveBundlePassage} from '../../utility/redux/bundles/slice';
import {BundlePassageType} from '../../types/bundle';
import {getEmptyDeckText} from '../../utility/helpers/deck';
import {useSharedValue} from 'react-native-reanimated';
import AnimatedThemeText from '../common/AnimatedThemeText';
import { useShouldAutoFlip } from '../../utility/redux/card_flip/selectors';

const PassageItemComponent = memo(
  WithSharedTransitionKey(FlippableLyricCard),
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

  const activePassageKeyForBundle = useActivePassageKeyForBundle({bundleKey});

  const dispatch = useDispatch();
  const {sharedDeckProgress} = useThemeProgress();
  const {deckHeight, marginHorizontal, itemMarginTop, deckMarginTop} =
    useLyricCardSize();

  const isActiveBundle = useIsActiveBundle(bundleKey);
  const sharedIsActiveBundle = useSharedValue(isActiveBundle);
  useEffect(() => {
    sharedIsActiveBundle.value = isActiveBundle;
  }, [isActiveBundle]);

  // @ts-ignore
  const ref = React.useRef<NativeCarousel>(null);

  useEffect(() => {
    const expectedIndex = passages.findIndex(
      p => p.passageKey === activePassageKeyForBundle,
    );

    if (expectedIndex !== ref.current?.getCurrentIndex()) {
      ref.current?.scrollTo({
        animated: false,
        index: expectedIndex,
      });
    }
  }, [activePassageKeyForBundle, ref.current?.getCurrentIndex()]);

  if (passages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{getEmptyDeckText({bundle})}</Text>
      </View>
    );
  }

  return (
    <React.Fragment>
      {isActiveBundle && (
        <AnimatedThemeText />
      )}

      <Carousel
        ref={ref}
        style={{...styles.carouselContainer, marginTop: deckMarginTop}}
        loop
        data={passages}
        height={deckHeight}
        width={Dimensions.get('window').width}
        vertical
        mode="vertical-stack"
        modeConfig={{
          stackInterval: passages.length > 1 ? 30 : 0,
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
          const item = passages[slideIndex];

          if (isActiveBundle) {
            dispatch(setActiveBundlePassage(item));
          }
        }}
        renderItem={({item}: {item: unknown}) => {
          return (
            <PassageItemComponent
              passage={item as BundlePassageType}
              bundleKey={bundleKey}
              measurementContext="MAIN_SCREEN"
              containerStyle={{marginTop: itemMarginTop, marginHorizontal}}
            />
          );
        }}
        keyExtractor={(item: unknown, index: number) =>
          `${(item as BundlePassageType).passageKey}-${bundleKey}-${index}`
        }
        enabled={passages.length > 1}
      />
    </React.Fragment>
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
