// container to wrap either a PassageItem or scroll view in a FullLyricsScreen, ensuring
// we have a consistent look for both

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {addColorOpacity} from '../../utility/color';
import ThemeType from '../../types/theme';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  theme?: ThemeType;
  containerRef?: React.RefObject<View>;
  ignoreFlex?: boolean;
  children: React.ReactNode;
};

const ItemContainer = (props: Props) => {
  const {theme, containerRef, ignoreFlex} = props;
  const {backgroundColor} = theme || {backgroundColor: 'lightgrey'};

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{...styles.itemContainer, flex: ignoreFlex ? 0 : 1}}
      ref={containerRef}>
      <LinearGradient
        // eslint-disable-next-line react-native/no-inline-styles
        style={{...styles.linearGradient, flex: ignoreFlex ? 0 : 1}}
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
    backgroundColor: 'lightgrey',
    borderRadius: 24,
    borderColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
  },
  linearGradient: {
    borderRadius: 24,
  },
});

export default ItemContainer;
