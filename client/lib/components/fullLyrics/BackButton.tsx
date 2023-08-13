import React from 'react';
import ThemeType from '../../types/theme';
import ThemeButton from '../common/ThemeButton';
import {StyleSheet} from 'react-native';

type Props = {
  theme: ThemeType;
  onPress: () => void;
};

const BackButton = (props: Props) => {
  const {theme, onPress} = props;
  const text = 'Back';

  return (
    <ThemeButton
      text={text}
      theme={theme}
      useSaturatedColor={false}
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

export default BackButton;
