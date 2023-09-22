import React from 'react';
import {PassageItemScreenProps} from '../../types/navigation';
import ThemeBackground from '../common/ThemeBackground';
import {Dimensions, StyleSheet, View} from 'react-native';
import BottomBar from '../common/BottomBar';
import ShareBottomSheet from './ShareBottomSheet/ShareBottomSheet';
import {WithSharedTransitionKey} from './WithSharedTransitionKey';
import {WithPassageItemMeasurement} from './WithPassageItemMeasurement';
import PassageItem from './PassageItem';
import {usePassageItemSize} from '../../utility/max_size';
import {SafeAreaView} from 'react-native-safe-area-context';

const PassageItemComponent = WithSharedTransitionKey(
  WithPassageItemMeasurement(PassageItem),
);

const PassageItemScreen = ({route}: PassageItemScreenProps) => {
  const {passage, theme} = route.params;

  const {height, marginHorizontal, marginTop} = usePassageItemSize();
  const width = Dimensions.get('window').width * 0.85;

  return (
    <ThemeBackground theme={theme}>
      <SafeAreaView>
        <View
          style={{
            ...styles.container,
            width,
            marginTop,
            marginHorizontal,
            maxHeight: height,
          }}>
          <PassageItemComponent passage={passage} />
        </View>
      </SafeAreaView>
      <BottomBar activeGroupKey={null} style={styles.bottomBar} />
      <ShareBottomSheet />
    </ThemeBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomBar: {
    alignSelf: 'center',
    bottom: 0,
    marginTop: 12,
  },
});

export default PassageItemScreen;
