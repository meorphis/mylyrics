import {useSelector} from 'react-redux';
import {RootState} from '..';
import _ from 'lodash';

// returns the passage that can currently be shown in a LyricCard in the share bottom sheet
export const useShareablePassage = () => {
  return useSelector(
    (state: RootState) => state.shareablePassage.passage,
    (prev, next) => _.isEqual(prev, next),
  );
};

// returns just the theme selection for the LyricCard in the share bottom sheet
export const useThemeSelection = () => {
  return useSelector(
    (state: RootState) =>
      state.shareablePassage.passage.customization.themeSelection,
    (prev, next) => _.isEqual(prev, next),
  );
};

// returns a boolean indicating whether or not the bottom sheet has just been triggered
export const useBottomSheetTriggered = () => {
  return useSelector(
    (state: RootState) => state.shareablePassage.bottomSheetTriggered,
  );
};
