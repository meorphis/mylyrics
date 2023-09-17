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
import {textStyleCommon} from '../../utility/text';
import ThemeType from '../../types/theme';
import AnimatedLinearGradient from './AnimatedLinearGradient';

type Background = 'solid' | 'gradient';

type Props = {
  text?: string;
  theme?: ThemeType;
  useSaturatedColor?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  background?: Background;
  iconName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const ThemeButton = (props: Props) => {
  const {
    text,
    useSaturatedColor = false,
    isDisabled,
    onPress,
    background = 'solid',
    iconName,
    style,
    textStyle,
  } = props;

  // const buttonColor = addColorOpacity(
  //   baseColor,
  //   isDisabled ? (isButtonColorLight ? 0.3 : 0.1) : 1,
  // );

  // const textColor = addColorOpacity(
  //   isButtonColorLight ? '#000000' : '#FFFFFF',
  //   isDisabled ? 0.5 : 1,
  // );
  // const borderColor = useSaturatedColor
  //   ? addColorOpacity(
  //       isButtonColorLight ? '#444444' : '#CCCCCC',
  //       isDisabled ? 0.2 : 1,
  //     )
  //   : undefined;

  const ContainerComponent =
    background === 'solid' ? SolidBackground : GradientBackground;

  const borderColor = useSaturatedColor ? '#ffffff80' : '#00000040';
  const textColor = useSaturatedColor ? 'white' : 'black';

  return (
    <TouchableOpacity
      style={{
        ...styles.button,
        ...style,
        ...(useSaturatedColor ? styles.saturated : styles.unsaturated),
        borderColor,
      }}
      onPress={onPress}
      disabled={isDisabled}>
      <ContainerComponent {...props}>
        {iconName && <Ionicon name={iconName} size={24} color={textColor} />}
        {iconName && text && <View style={styles.textIconPadding} />}
        {text && (
          <Text
            style={{
              ...textStyleCommon,
              ...styles.text,
              ...textStyle,
              color: textColor,
            }}>
            {text}
          </Text>
        )}
      </ContainerComponent>
    </TouchableOpacity>
  );
};

const GradientBackground = (
  props: Props & {
    children: React.ReactNode;
  },
) => {
  const {theme, useSaturatedColor, children} = props;

  const colors = useSaturatedColor
    ? ['black', theme?.backgroundColor ?? 'white']
    : [theme?.backgroundColor ?? 'black', 'white'];

  return (
    <AnimatedLinearGradient
      style={styles.gradientBackground}
      start={{x: -0.5, y: -0.5}}
      end={{x: 1, y: 1}}
      colors={colors}>
      {children}
    </AnimatedLinearGradient>
  );
};

const SolidBackground = (
  props: Props & {
    children: React.ReactNode;
  },
) => {
  const {useSaturatedColor, children} = props;

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        ...styles.solidBackground,
        backgroundColor: useSaturatedColor ? 'black' : 'white',
      }}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
  },
  unsaturated: {
    borderWidth: 3,
  },
  saturated: {
    borderWidth: 3,
  },
  text: {
    alignSelf: 'center',
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
  },
  textIconPadding: {
    width: 8,
  },
  gradientBackground: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 15,
  },
  solidBackground: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
  },
});

export default ThemeButton;
