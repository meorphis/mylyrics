// container to wrap either a PassageItem or NonLoadedPassageItem, ensuring
// we have a consistent look for both

import React from 'react';
import {StyleSheet, View} from 'react-native';

type Props = {
  children: React.ReactNode;
};

const PassageItemContainer = (props: Props) => {
  return <View style={styles.itemContainer}>{props.children}</View>;
};

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    backgroundColor: 'lightgrey',
    borderRadius: 12,
    borderColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
  },
});

export default PassageItemContainer;
