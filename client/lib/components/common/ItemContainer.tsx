// container to wrap either a PassageItem or NonLoadedPassageItem, ensuring
// we have a consistent look for both

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {addColorOpacity} from '../../utility/color';
import ThemeType from '../../types/theme';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  theme?: ThemeType;
  children: React.ReactNode;
};

const ItemContainer = (props: Props) => {
  const {theme} = props;
  const {backgroundColor} = theme || {backgroundColor: 'lightgrey'};

  return (
    <View style={styles.itemContainer}>
      <LinearGradient
        style={styles.linearGradient}
        colors={[addColorOpacity(backgroundColor, 0.75), backgroundColor]}
        start={{x: 0, y: 0.0}}
        end={{x: 0, y: 1}}>
        {props.children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    backgroundColor: 'lightgrey',
    borderRadius: 16,
    borderColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
  },
  linearGradient: {
    flex: 1,
    borderRadius: 16,
  },
});

export default ItemContainer;
