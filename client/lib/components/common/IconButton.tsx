import React from 'react';
import {StyleSheet, TextStyle, ViewStyle} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {Text} from 'react-native';
import {textStyleCommon} from '../../utility/helpers/text';
import {trigger as triggerHapticFeedback} from 'react-native-haptic-feedback';

type Props = {
  text?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const IconButton = (props: Props) => {
  const {text, icon, onPress, style, textStyle} = props;

  return (
    <TouchableOpacity
      style={{...styles.badge, ...style}}
      onPress={() => {
        if (onPress) {
          triggerHapticFeedback('impactLight');
          onPress();
        }
      }}
      disabled={!onPress}>
      {icon}
      {text == null ? null : (
        <Text style={{...textStyleCommon, ...styles.textStyle, ...textStyle}}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
  },
  textStyle: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});

export default IconButton;
