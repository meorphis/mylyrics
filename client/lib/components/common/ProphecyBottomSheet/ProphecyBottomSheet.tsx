import React, {useCallback, useMemo} from 'react';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {StyleSheet} from 'react-native';
import {useTheme} from '../../../utility/theme';
import {addColorOpacity} from '../../../utility/color';
import ProphecyView from './ProphecyView';
import {useSelector} from 'react-redux';
import {RootState} from '../../../utility/redux';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
};

const ProphecyBottomSheet = (props: Props) => {
  const {bottomSheetRef} = props;
  const theme = useTheme();

  const snapPoints = useMemo(() => ['85%'], []);
  const {cards, prophecy} = useSelector(
    (state: RootState) => state.prophecy,
    (left, right) =>
      left.cards.length === right.cards.length &&
      left.prophecy === right.prophecy,
  );

  const renderBackdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: addColorOpacity(theme.backgroundColor, 0.95),
      }}>
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
});

export default ProphecyBottomSheet;
