import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

type Props = {
  noun: string;
  color: string;
};

const LoadingIndicator = (props: Props) => {
  const {noun, color} = props;

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={color} />
      <Text style={{...styles.loadingText, color: color}}>loading {noun}…</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: 'darkgrey',
  },
});

export default LoadingIndicator;
