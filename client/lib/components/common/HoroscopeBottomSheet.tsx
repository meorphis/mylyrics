import React, {useMemo} from 'react';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../../utility/theme';
import {
  addColorOpacity,
  ensureColorContrast,
  isColorLight,
} from '../../utility/color';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import tinycolor from 'tinycolor2';
import {getLyricsColor} from '../../utility/lyrics';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
};

const HoroscopeBottomSheet = (props: Props) => {
  const {bottomSheetRef} = props;
  const theme = useTheme();

  const backgroundColor = theme.backgroundColor;
  const textColor = getLyricsColor({theme});

  const snapPoints = useMemo(() => ['65%'], []);

  const horoscope = useSelector((state: RootState) => state.horoscope);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: addColorOpacity(theme.backgroundColor, 0.95),
      }}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <Text style={{...styles.titleText, color: textColor}}>
          🔮 your horoscope 🔮
        </Text>
        <View
          style={{
            ...styles.horoscopeContainer,
            backgroundColor: getContrastingBackgroundColor(backgroundColor),
          }}>
          <Text style={{...styles.horoscopeText, color: textColor}}>
            {horoscope}
          </Text>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const getContrastingBackgroundColor = (backgroundColor: string) => {
  const {lightenable, darkenable} = ensureColorContrast({
    lightenable: backgroundColor,
    darkenable: backgroundColor,
    preference: isColorLight(backgroundColor) ? 'darken' : 'lighten',
    minDistance: 6,
  });

  const color = isColorLight(backgroundColor) ? darkenable : lightenable;
  return tinycolor(color).setAlpha(0.5).toRgbString();
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 16,
    textAlign: 'center',
  },
  horoscopeContainer: {
    flexDirection: 'column',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  horoscopeText: {
    fontSize: 20,
    fontWeight: '200',
  },
});

export default HoroscopeBottomSheet;
