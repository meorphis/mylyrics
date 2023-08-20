import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../../utility/theme';
import {addColorOpacity, isColorLight} from '../../utility/color';

const ThemedLoadingIndicator = () => {
  const theme = useTheme();
  const color = isColorLight(addColorOpacity(theme.backgroundColor, 0.6))
    ? 'black'
    : 'white';

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={color} />
      <Text style={{...styles.loadingText, color: color}}>
        loading more passages…
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginLeft: 8,
    color: 'darkgrey',
  },
});

export default ThemedLoadingIndicator;
