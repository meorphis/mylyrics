import React from 'react';
import ThemeType from '../../types/theme';
import ThemeButton from '../common/ThemeButton';
import {ViewStyle} from 'react-native';

type Props = {
  highlightedIndexes: number[];
  theme: ThemeType;
  onPress: () => void;
  style?: ViewStyle;
};

const SelectionButton = (props: Props) => {
  const {highlightedIndexes, theme, onPress, style} = props;
  const isDisabled = highlightedIndexes.length === 0;
  const text = isDisabled
    ? 'No lines selected'
    : `Select ${highlightedIndexes.length} line` +
      (highlightedIndexes.length > 1 ? 's' : '');

  return (
    <ThemeButton
      text={text}
      theme={theme}
      useSaturatedColor
      isDisabled={isDisabled}
      onPress={onPress}
      style={style}
    />
  );
};

export default SelectionButton;
