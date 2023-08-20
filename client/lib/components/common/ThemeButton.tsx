// renders a single tag for a passage

import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Ionicon from 'react-native-vector-icons/Ionicons';

import React from 'react';
import {
  isColorLight,
  buttonColorsForTheme,
  addColorOpacity,
  ButtonColorChoice,
} from '../../utility/color';
import {textStyleCommon} from '../../utility/text';
import ThemeType from '../../types/theme';

type Props = {
  text?: string;
  theme: ThemeType;
  colorChoice: ButtonColorChoice;
  isDisabled?: boolean;
  onPress: () => void;
  Container?: React.ComponentType<any>;
  iconName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const ThemeButton = (props: Props) => {
  const {
    text,
    theme,
    colorChoice,
    isDisabled,
    onPress,
    Container,
    iconName,
    style,
    textStyle,
  } = props;

  const useSaturatedColor = [
    ButtonColorChoice.detailSaturated,
    ButtonColorChoice.primarySaturated,
    ButtonColorChoice.secondarySaturated,
  ].includes(colorChoice);

  const baseColor = buttonColorsForTheme(theme, colorChoice);
  const buttonColor = addColorOpacity(baseColor, isDisabled ? 0.2 : 1);

  const isButtonColorLight = isColorLight(buttonColor);
  const textColor = isButtonColorLight ? '#000000' : '#FFFFFF';
  const borderColor = useSaturatedColor
    ? isButtonColorLight
      ? '#444444'
      : '#CCCCCC'
    : undefined;

  const ContainerComponent = Container || Fragment;

  return (
    <TouchableOpacity
      style={{
        ...styles.button,
        ...style,
        ...(useSaturatedColor ? styles.saturated : styles.unsaturated),
        backgroundColor: buttonColor,
        borderColor,
      }}
      onPress={onPress}
      disabled={isDisabled}>
      <ContainerComponent color={buttonColor}>
        {iconName && <Ionicon name={iconName} size={24} color={textColor} />}
        {iconName && text && <View style={styles.textIconPadding} />}
        {text && (
          <Text
            style={{
              ...textStyleCommon,
              ...styles.text,
              color: textColor,
              ...textStyle,
            }}>
            {text}
          </Text>
        )}
      </ContainerComponent>
    </TouchableOpacity>
  );
};

const Fragment = (props: {color: string; children: React.ReactNode}) => {
  const {children} = props;

  return <React.Fragment>{children}</React.Fragment>;
};

const styles = StyleSheet.create({
  button: {
    padding: 6,
    marginHorizontal: 6,
    borderRadius: 10,
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
  text: {
    alignSelf: 'center',
    textAlign: 'center',
  },
  textIconPadding: {
    width: 8,
  },
});

export default ThemeButton;
