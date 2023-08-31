import {StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../../utility/theme';
import ThemeButton from './ThemeButton';
import React from 'react';
import {ButtonColorChoice, addColorOpacity} from '../../utility/color';
import BottomSheet from '@gorhom/bottom-sheet';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import GroupSelectorBottomSheet from './GroupSelectorBottomSheet';
import HoroscopeBottomSheet from './HoroscopeBottomSheet';

type Props = {
  activeGroupKey: string | null;
  onGroupSelected?: () => void;
  style?: ViewStyle;
};

const BottomBar = (props: Props) => {
  const {activeGroupKey, onGroupSelected, style} = props;

  const groupSelectorBottomSheetRef = React.useRef<BottomSheet>(null);
  const horoscopeBottomSheetRef = React.useRef<BottomSheet>(null);

  const theme = useTheme();

  return (
    <React.Fragment>
      <View style={{...styles.menuRow, ...style}}>
        <ThemeButton
          text={activeGroupKey || ''}
          theme={theme}
          colorChoice={ButtonColorChoice.detailUnsaturated}
          onPress={() => {
            groupSelectorBottomSheetRef?.current?.expand();
          }}
          Container={AnimatedButtonLinearGradient}
          iconName="grid-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
        <ThemeButton
          theme={theme}
          colorChoice={ButtonColorChoice.detailUnsaturated}
          onPress={() => {
            horoscopeBottomSheetRef.current?.expand();
          }}
          Container={AnimatedButtonLinearGradient}
          iconName="eye-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
        {/* <ThemeButton
          theme={theme}
          colorChoice={ButtonColorChoice.detailUnsaturated}
          onPress={() => {}}
          Container={AnimatedButtonLinearGradient}
          iconName="person-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        /> */}
      </View>
      <GroupSelectorBottomSheet
        activeGroupKey={activeGroupKey}
        bottomSheetRef={groupSelectorBottomSheetRef}
        onGroupSelected={onGroupSelected}
      />
      <HoroscopeBottomSheet bottomSheetRef={horoscopeBottomSheetRef} />
    </React.Fragment>
  );
};

const AnimatedButtonLinearGradient = (props: {
  color: string;
  children: React.ReactNode;
}) => {
  const {color, children} = props;

  return (
    <AnimatedLinearGradient
      style={styles.linearGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1.0}}
      colors={[addColorOpacity(color, 0.9), addColorOpacity(color, 0.1)]}>
      {children}
    </AnimatedLinearGradient>
  );
};

const styles = StyleSheet.create({
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 36,
    alignContent: 'center',
    padding: 0,
    borderRadius: 16,
  },
  gridButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    padding: 0,
    borderRadius: 5,
  },
  linearGradient: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 5,
  },
});

export default BottomBar;
