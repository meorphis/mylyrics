import React, {memo} from 'react';
import {useTheme} from '../../utility/theme';
import {addColorOpacity} from '../../utility/color';
import {StyleSheet, View} from 'react-native';

const InactivePassageItem = () => {
  const theme = useTheme();

  return (
    <View
      style={{
        ...styles.linearGradient,
        backgroundColor: addColorOpacity(theme.backgroundColor, 0.7),
      }}
    />
  );
};

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
});

export default memo(InactivePassageItem);
