// container to wrap either a PassageItem or scroll view in a FullLyricsScreen, ensuring
// we have a consistent look for both

import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import ThemeType from '../../types/theme';
import LinearGradient from 'react-native-linear-gradient';
import {isColorLight} from '../../utility/color';

type Props = {
  theme?: ThemeType;
  style?: ViewStyle;
  containerRef?: React.RefObject<View>;
  ignoreFlex?: boolean;
  omitBorder?: boolean;
  children: React.ReactNode;
};

export const ITEM_CONTAINER_BORDER_WIDTH = 6;
export const ITEM_CONTAINER_BORDER_RADIUS = 36;

const ItemContainer = (props: Props) => {
  const {theme, style, containerRef, omitBorder, ignoreFlex} = props;
  const {backgroundColor} = theme || {backgroundColor: 'lightgrey'};
  const borderWidth = omitBorder ? 0 : ITEM_CONTAINER_BORDER_WIDTH;
  const borderColor = isColorLight(backgroundColor) ? '#00000040' : '#ffffff40';

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        ...styles.itemContainer,
        flex: ignoreFlex ? 0 : 1,
        borderWidth,
        borderColor,
        ...style,
      }}
      ref={containerRef}>
      <LinearGradient
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          flex: ignoreFlex ? 0 : 1,
          borderRadius: 36 - borderWidth,
        }}
        colors={[backgroundColor, backgroundColor]}
        start={{x: 0, y: 0.0}}
        end={{x: 0, y: 1}}>
        {props.children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    borderRadius: ITEM_CONTAINER_BORDER_RADIUS,
    borderColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default ItemContainer;
