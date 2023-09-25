import React from 'react';
import ThemeButton from '../common/ThemeButton';
import {ViewStyle} from 'react-native';

type Props = {
  highlightedIndexes: number[];
  onPress: () => void;
  style?: ViewStyle;
};

// button to select all of the lines that are currently highlighted
const SelectionButton = (props: Props) => {
  const {highlightedIndexes, onPress, style} = props;
  const isDisabled = highlightedIndexes.length === 0;
  const text = isDisabled
    ? 'No lines selected'
    : `Select ${highlightedIndexes.length} line` +
      (highlightedIndexes.length > 1 ? 's' : '');

  return (
    <ThemeButton
      text={text}
      useSaturatedColor
      isDisabled={isDisabled}
      onPress={onPress}
      style={style}
    />
  );
};

export default SelectionButton;
