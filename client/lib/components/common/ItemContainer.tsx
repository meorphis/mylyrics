// container to wrap either a PassageItem or scroll view in a FullLyricsScreen, ensuring
// we have a consistent look for both

import React from 'react';
import {StyleSheet, View} from 'react-native';
import ThemeType from '../../types/theme';
import LinearGradient from 'react-native-linear-gradient';
import {isColorLight} from '../../utility/color';

type Props = {
  theme?: ThemeType;
  containerRef?: React.RefObject<View>;
  ignoreFlex?: boolean;
  omitBorder?: boolean;
  children: React.ReactNode;
};

const ItemContainer = (props: Props) => {
  const {theme, containerRef, ignoreFlex} = props;
  const {backgroundColor} = theme || {backgroundColor: 'lightgrey'};
  const borderWidth = props.omitBorder ? 0 : 4;
  const borderColor = isColorLight(backgroundColor) ? '#00000040' : '#ffffff40';

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        ...styles.itemContainer,
        flex: ignoreFlex ? 0 : 1,
        borderWidth,
        borderColor,
      }}
      ref={containerRef}>
      <LinearGradient
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          flex: ignoreFlex ? 0 : 1,
          borderRadius: 24 - borderWidth,
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
    borderRadius: 24,
    borderColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default ItemContainer;
