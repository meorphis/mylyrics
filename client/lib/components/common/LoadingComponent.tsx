import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';

type Props = {
  size?: number | 'small' | 'large' | undefined;
};

const LoadingComponent = (props: Props) => {
  const {size} = props;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
  },
});
export default LoadingComponent;
