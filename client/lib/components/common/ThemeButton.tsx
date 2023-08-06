// renders a single tag for a passage

import {StyleSheet, Text, TouchableOpacity, ViewStyle} from 'react-native';
import React from 'react';
import {
  isColorLight,
  buttonColorsForTheme,
  addColorOpacity,
} from '../../utility/color';
import {textStyleCommon} from '../../utility/text';
import ThemeType from '../../types/theme';

type Props = {
  text: string;
  theme: ThemeType;
  useSaturatedColor: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

const ThemeButton = (props: Props) => {
  const {text, theme, useSaturatedColor, isDisabled, onPress, style} = props;

  const {unsaturatedColor, saturatedColor} = buttonColorsForTheme(theme);
  const buttonColor = addColorOpacity(
    useSaturatedColor ? saturatedColor : unsaturatedColor,
    isDisabled ? 0.5 : 1,
  );

  const isButtonColorLight = isColorLight(buttonColor);
  const textColor = isButtonColorLight ? '#000000' : '#FFFFFF';
  const borderColor = useSaturatedColor
    ? isButtonColorLight
      ? '#444444'
      : '#CCCCCC'
    : undefined;

  return (
    <TouchableOpacity
      style={{
        ...styles.button,
        ...(useSaturatedColor ? styles.saturated : styles.unsaturated),
        backgroundColor: addColorOpacity(
          useSaturatedColor ? saturatedColor : unsaturatedColor,
          isDisabled ? 0.2 : 1,
        ),
        borderColor,
        ...style,
      }}
      onPress={onPress}
      disabled={isDisabled}>
      <Text style={{...textStyleCommon, color: textColor}}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    padding: 6,
    marginHorizontal: 6,
  },
  unsaturated: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent black border
  },
  saturated: {
    borderWidth: 2,
    shadowColor: '#000', // Adding a subtle drop shadow
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
});

export default ThemeButton;
