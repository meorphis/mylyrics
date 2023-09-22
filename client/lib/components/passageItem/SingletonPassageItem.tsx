import React from 'react';
import {useSingletonPassage} from '../../utility/singleton_passage';
import {SafeAreaView, View} from 'react-native';
import {usePassageItemSize} from '../../utility/max_size';
import {WithSharedTransitionKey} from './WithSharedTransitionKey';
import {WithPassageItemMeasurement} from './WithPassageItemMeasurement';
import PassageItem from './PassageItem';

const PassageItemComponent = WithSharedTransitionKey(
  WithPassageItemMeasurement(PassageItem),
);
export const SingletonPassageItem = () => {
  const singletonPassage = useSingletonPassage();
  const {height, marginHorizontal, marginTop} = usePassageItemSize();

  if (!singletonPassage) {
    return null;
  }

  console.log(
    'RE-RENDER SP',
    singletonPassage.passage.lyrics.split('\n').length,
  );

  return (
    <SafeAreaView>
      <View
        style={{
          marginTop,
          marginHorizontal,
          height,
        }}>
        <PassageItemComponent passage={singletonPassage.passage} />
      </View>
    </SafeAreaView>
  );
};
