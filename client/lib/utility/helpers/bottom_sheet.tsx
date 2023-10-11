import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React from 'react';
import {useCallback} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {StyleSheet} from 'react-native';

// a default backdrop to use with bottom sheets throughout the app
export const useBottomSheetBackdrop = ({opacity}: {opacity: number}) => {
  return useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={opacity}
      />
    ),
    [],
  );
};

export const BottomSheetBackgroundComponent = () => {
  return (
    <LinearGradient
      colors={['#D3D3D3', '#FFF']}
      angle={75}
      useAngle
      style={styles.backgroundComponent}
    />
  );
};

const styles = StyleSheet.create({
  backgroundComponent: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.9,
  },
});
