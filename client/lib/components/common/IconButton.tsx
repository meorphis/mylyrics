import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {Text} from 'react-native';
import {textStyleCommon} from '../../utility/text';

type Props = {
  text?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

const IconButton = (props: Props) => {
  const {text, icon, onPress, style} = props;

  return (
    <TouchableOpacity
      style={{...(onPress ? styles.button : null), ...styles.badge, ...style}}
      onPress={onPress}
      disabled={!onPress}>
      {icon}
      {text == null ? null : (
        <Text style={{...textStyleCommon, ...styles.textStyle}}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 24,
    borderRadius: 24,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textStyle: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});

export default IconButton;
