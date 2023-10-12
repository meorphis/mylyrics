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
  isSemiTransparent?: boolean;
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
    isSemiTransparent = true,
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
        backgroundColor: getBackgroundColor({
          useSaturatedColor,
          isSemiTransparent,
        }),
        ...(!isSemiTransparent && !isDisabled ? styles.buttonShadow : {}),
        opacity: isDisabled ? 0.15 : 1,
        borderColor,
        ...style,
      }}
      onPress={() => {
        triggerHapticFeedback('impactLight');
        onPress();
      }}
      disabled={isDisabled}>
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
    </TouchableOpacity>
  );
};

const getBackgroundColor = ({
  useSaturatedColor,
  isSemiTransparent,
}: {
  useSaturatedColor: boolean;
  isSemiTransparent: boolean;
}) => {
  if (isSemiTransparent) {
    return useSaturatedColor ? '#444444c0' : '#ffffffc0';
  } else {
    return useSaturatedColor ? '#888888' : '#ffffff';
  }
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    borderWidth: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
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
});

export default ThemeButton;
