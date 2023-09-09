import {StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '../../utility/theme';
import ThemeButton from './ThemeButton';
import React from 'react';
import {ButtonColorChoice, addColorOpacity} from '../../utility/color';
import BottomSheet from '@gorhom/bottom-sheet';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import GroupSelectorBottomSheet from './GroupSelectorBottomSheet';
import ProphecyBottomSheet from './ProphecyBottomSheet/ProphecyBottomSheet';
import WalkthroughStepComponent from './WalkthroughStep';
import {useWalkthroughStep} from '../../utility/walkthrough';
import {useDispatch} from 'react-redux';
import {setActivePassage} from '../../utility/redux/active_passage';

type Props = {
  activeGroupKey: string | null;
  onGroupSelected?: () => void;
  style?: ViewStyle;
};

const BottomBar = (props: Props) => {
  const {activeGroupKey, onGroupSelected, style} = props;

  const groupSelectorBottomSheetRef = React.useRef<BottomSheet>(null);
  const prophecyBottomSheetRef = React.useRef<BottomSheet>(null);

  const theme = useTheme();
  const dispatch = useDispatch();

  const {walkthroughStepStatus, setWalkthroughStepAsCompleted} =
    useWalkthroughStep('explore');

  return (
    <React.Fragment>
      <View style={{...styles.menuRow, ...style}}>
        <WalkthroughStepComponent
          walkthroughStepStatus={walkthroughStepStatus}
          setWalkthroughStepAsCompleted={setWalkthroughStepAsCompleted}
          text="explore lyrics from your favorite songs grouped by emotional themes">
          <ThemeButton
            text={
              activeGroupKey && activeGroupKey !== 'likes' ? activeGroupKey : ''
            }
            theme={theme}
            colorChoice={
              activeGroupKey && activeGroupKey !== 'likes'
                ? ButtonColorChoice.detailSaturated
                : ButtonColorChoice.detailUnsaturated
            }
            onPress={() => {
              setWalkthroughStepAsCompleted();
              groupSelectorBottomSheetRef?.current?.expand();
            }}
            Container={AnimatedButtonLinearGradient}
            iconName="grid-outline"
            textStyle={styles.gridButtonText}
            style={styles.button}
          />
        </WalkthroughStepComponent>
        <ThemeButton
          theme={theme}
          colorChoice={
            activeGroupKey === 'likes'
              ? ButtonColorChoice.detailSaturated
              : ButtonColorChoice.detailUnsaturated
          }
          onPress={() => {
            dispatch(setActivePassage({passageKey: null, groupKey: 'likes'}));
          }}
          Container={AnimatedButtonLinearGradient}
          iconName="heart-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
        <ThemeButton
          theme={theme}
          colorChoice={ButtonColorChoice.detailUnsaturated}
          onPress={() => {
            prophecyBottomSheetRef.current?.expand();
          }}
          Container={AnimatedButtonLinearGradient}
          iconName="eye-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
      </View>
      <GroupSelectorBottomSheet
        activeGroupKey={activeGroupKey}
        bottomSheetRef={groupSelectorBottomSheetRef}
        onGroupSelected={onGroupSelected}
      />
      <ProphecyBottomSheet bottomSheetRef={prophecyBottomSheetRef} />
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
    marginBottom: 8,
  },
  gridButtonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  button: {
    padding: 0,
    borderRadius: 5,
  },
  tooltipText: {
    flex: 1,
    flexGrow: 1,
    fontSize: 14,
  },
  linearGradient: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 5,
  },
});

export default BottomBar;
