import React from 'react';
import {SafeAreaView, View} from 'react-native';
import {WithSharedTransitionKey} from '../LyricCard/hoc/WithSharedTransitionKey';
import LyricCard from '../LyricCard/LyricCard';
import {useLyricCardSize} from '../../utility/helpers/lyric_card';
import {useBundle} from '../../utility/redux/bundles/selectors';
import {BundlePassageType} from '../../types/bundle';

const LyricCardComponent = WithSharedTransitionKey(LyricCard);

// an alternative to a Deck - sometimes we want to show just a single card in the
// DecksCarousel
export const SingletonLyricCard = () => {
  console.log('rendering SingletonPassageItem');

  const singletonPassage = useBundle({bundleKey: 'singleton'}).passages
    .data[0] as BundlePassageType;
  const {deckHeight, marginHorizontal, deckMarginTop, itemMarginTop} =
    useLyricCardSize();

  if (!singletonPassage) {
    return null;
  }

  return (
    <SafeAreaView>
      <View
        style={{
          marginTop: deckMarginTop + itemMarginTop,
          marginHorizontal,
          height: deckHeight,
        }}>
        <LyricCardComponent
          passage={singletonPassage}
          measurementContext="MAIN_SCREEN"
        />
      </View>
    </SafeAreaView>
  );
};
