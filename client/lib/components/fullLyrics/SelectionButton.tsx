import React from 'react';
import ThemeType from '../../types/theme';
import ThemeButton from '../common/ThemeButton';
import {StyleSheet} from 'react-native';

type Props = {
  highlightedIndexes: number[];
  theme: ThemeType;
  onPress: () => void;
};

const SelectionButton = (props: Props) => {
  const {highlightedIndexes, theme, onPress} = props;
  const isDisabled = highlightedIndexes.length === 0;
  const text = isDisabled
    ? 'No lines selected'
    : `Select ${highlightedIndexes.length} line` +
      (highlightedIndexes.length > 1 ? 's' : '');

  return (
    <ThemeButton
      text={text}
      theme={theme}
      useSaturatedColor={true}
      isDisabled={isDisabled}
      onPress={onPress}
      style={styles.button}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    margin: 12,
    textAlign: 'center',
  },
});

export default SelectionButton;
