import React from 'react';
import ThemeButton from '../common/ThemeButton';
import {ViewStyle} from 'react-native';

type Props = {
  onPress: () => void;
  style?: ViewStyle;
};

// simple button to go back to the previous screen
const BackButton = (props: Props) => {
  const {onPress, style} = props;
  return <ThemeButton text="Back" onPress={onPress} style={style} />;
};

export default BackButton;
