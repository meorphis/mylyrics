import React from 'react';
import ThemeType from '../../types/theme';
import ThemeButton from '../common/ThemeButton';
import {ViewStyle} from 'react-native';

type Props = {
  theme: ThemeType;
  onPress: () => void;
  style?: ViewStyle;
};

const BackButton = (props: Props) => {
  const {theme, onPress, style} = props;
  const text = 'Back';

  return (
    <ThemeButton text={text} theme={theme} onPress={onPress} style={style} />
  );
};

export default BackButton;
