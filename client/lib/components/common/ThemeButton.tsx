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
import {textStyleCommon} from '../../utility/helpers/text';
import {trigger as triggerHapticFeedback} from 'react-native-haptic-feedback';

type Props = {
  text?: string;
  useSaturatedColor?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  iconName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  triggerHapticFeedback?: boolean;
};

const ThemeButton = (props: Props) => {
  const {
    text,
    useSaturatedColor = false,
    isDisabled,
    onPress,
    iconName,
    style,
    textStyle,
  } = props;

  const borderColor = useSaturatedColor ? '#ffffff80' : '#00000040';
  const textColor = useSaturatedColor ? 'white' : '#333';

  return (
    <TouchableOpacity
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        ...styles.button,
        ...style,
        opacity: isDisabled ? 0.15 : 1,
        borderColor,
      }}
      onPress={() => {
        triggerHapticFeedback('impactLight');
        onPress();
      }}
      disabled={isDisabled}>
      <SolidBackground {...props}>
        {iconName && <Ionicon name={iconName} size={28} color={textColor} />}
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
      </SolidBackground>
    </TouchableOpacity>
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
        backgroundColor: useSaturatedColor ? '#444444c0' : '#ffffffc0',
      }}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
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
  solidBackground: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
  },
});

export default ThemeButton;
