import React from 'react';
import {SafeAreaView, View} from 'react-native';
import {WithSharedTransitionKey} from '../PassageItem/hoc/WithSharedTransitionKey';
import LyricCard from '../PassageItem/LyricCard';
import {useLyricCardSize} from '../../utility/helpers/lyric_card';
import {useBundle} from '../../utility/redux/bundles/selectors';

const LyricCardComponent = WithSharedTransitionKey(LyricCard);

// an alternative to a Deck - sometimes we want to show just a single card in the
// DecksCarousel
export const SingletonLyricCard = () => {
  console.log('rendering SingletonPassageItem');

  const singletonPassage = useBundle({bundleKey: 'singleton_passage'})
    .passages[0];
  const {height, marginHorizontal, marginTop} = useLyricCardSize();

  if (!singletonPassage) {
    return null;
  }

  return (
    <SafeAreaView>
      <View
        style={{
          marginTop,
          marginHorizontal,
          height,
        }}>
        <LyricCardComponent
          passage={singletonPassage}
          measurementContext="MAIN_SCREEN"
        />
      </View>
    </SafeAreaView>
  );
};
