// used in place of Text throughout the UI to allow us to apply a consistent
// style

import React from 'react';
import {Text, StyleSheet, TextProps} from 'react-native';

const StyledText = ({style, ...props}: TextProps) => {
  return <Text style={[styles.default, style]} {...props} />;
};

const styles = StyleSheet.create({
  default: {
    fontFamily: 'Gill Sans',
  },
});

export default StyledText;
