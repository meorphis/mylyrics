import React, {memo, useMemo} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  BottomSheetBackgroundComponent,
  useBottomSheetBackdrop,
} from '../../utility/helpers/bottom_sheet';
import {textStyleCommon} from '../../utility/helpers/text';
import Chart from './Chart';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
};

const StatsBottomSheet = (props: Props) => {
  const {bottomSheetRef} = props;
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const snapPoint = Math.min(
    screenHeight - insets.top - 24,
    680 + insets.bottom,
  );
  const availableHeight = snapPoint - 160 - insets.bottom;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={useMemo(() => [snapPoint], [])}
      backdropComponent={useBottomSheetBackdrop({opacity: 0.8})}
      enablePanDownToClose
      backgroundComponent={BottomSheetBackgroundComponent}>
      <View style={styles.container}>
        <Text style={{...textStyleCommon, ...styles.titleText}}>
          🤓 your stats 🤓
        </Text>
        <Text
          style={{
            ...textStyleCommon,
            ...styles.descriptionText,
          }}>
          top recent vibes - updated daily
        </Text>
        <Chart availableHeight={availableHeight} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 20,
    fontWeight: '300',
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
});

export default memo(StatsBottomSheet, () => true);
