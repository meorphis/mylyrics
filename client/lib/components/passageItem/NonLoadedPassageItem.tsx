import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

type Props = {
  dataStatus: 'loading' | 'error';
  message: string;
};

const NonLoadedPassageItem = (props: Props) => {
  const {dataStatus, message} = props;

  switch (dataStatus) {
    case 'loading':
      return (
        <View style={styles.container}>
          <ActivityIndicator />
          <Text>{message}</Text>
        </View>
      );
    case 'error':
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  },
});

export default NonLoadedPassageItem;
