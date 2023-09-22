import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ErrorComponent = () => {
  return (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle-outline" size={24} color="darkred" />
      <Text style={styles.errorText}>an error occurred</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    marginLeft: 4,
    color: 'darkred',
  },
});

export default ErrorComponent;
