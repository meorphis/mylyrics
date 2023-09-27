import React, {memo, useMemo} from 'react';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {StyleSheet} from 'react-native';
import ProphecyView from './ProphecyView';
import {useProphecyInfo} from '../../utility/redux/prophecy/selectors';
import {useBottomSheetBackdrop} from '../../utility/helpers/bottom_sheet';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
};

// bottom sheet to show the view containing the prophecy cards, loading screen,
// or computed prophecy depending on state
const ProphecyBottomSheet = (props: Props) => {
  const {bottomSheetRef} = props;

  const snapPoints = useMemo(() => ['85%'], []);
  const {cards, prophecy} = useProphecyInfo();

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={useBottomSheetBackdrop({opacity: 0.8})}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheet}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <ProphecyView cards={cards} prophecy={prophecy} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  bottomSheet: {
    backgroundColor: '#CCC',
  },
});

export default memo(ProphecyBottomSheet);
