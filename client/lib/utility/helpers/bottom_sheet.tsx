import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React from 'react';
import {useCallback} from 'react';

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
