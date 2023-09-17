import {StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../../utility/theme';
import ThemeButton from './ThemeButton';
import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import GroupSelectorBottomSheet from './GroupSelectorBottomSheet';
import ProphecyBottomSheet from './ProphecyBottomSheet/ProphecyBottomSheet';
import WalkthroughStepComponent from './WalkthroughStep';
import {useWalkthroughStep} from '../../utility/walkthrough';
import {useDispatch} from 'react-redux';
import {setActivePassage} from '../../utility/redux/active_passage';
import {SafeAreaView} from 'react-native-safe-area-context';

type Props = {
  activeGroupKey: string | null;
  style?: ViewStyle;
};

const BottomBar = (props: Props) => {
  const {activeGroupKey, style} = props;

  const groupSelectorBottomSheetRef = React.useRef<BottomSheet>(null);
  const prophecyBottomSheetRef = React.useRef<BottomSheet>(null);

  const theme = useTheme();
  const dispatch = useDispatch();

  const {walkthroughStepStatus, setWalkthroughStepAsCompleted} =
    useWalkthroughStep('explore');

  return (
    <React.Fragment>
      <SafeAreaView style={{...styles.menuRow, ...style}}>
        <WalkthroughStepComponent
          walkthroughStepStatus={walkthroughStepStatus}
          setWalkthroughStepAsCompleted={setWalkthroughStepAsCompleted}
          text="explore lyrics from your favorite songs grouped by emotional themes">
          <ThemeButton
            text={
              activeGroupKey && activeGroupKey !== 'likes' ? activeGroupKey : ''
            }
            theme={theme}
            useSaturatedColor={
              activeGroupKey != null && activeGroupKey !== 'likes'
            }
            onPress={() => {
              setWalkthroughStepAsCompleted();
              groupSelectorBottomSheetRef?.current?.expand();
            }}
            background="gradient"
            iconName="grid-outline"
            textStyle={styles.gridButtonText}
            style={styles.button}
          />
        </WalkthroughStepComponent>
        <ThemeButton
          theme={theme}
          useSaturatedColor={activeGroupKey === 'likes'}
          onPress={() => {
            dispatch(setActivePassage({passageKey: null, groupKey: 'likes'}));
          }}
          background="gradient"
          iconName="heart-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
        <ThemeButton
          theme={theme}
          onPress={() => {
            prophecyBottomSheetRef.current?.expand();
          }}
          background="gradient"
          iconName="eye-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
      </SafeAreaView>
      <GroupSelectorBottomSheet
        activeGroupKey={activeGroupKey}
        bottomSheetRef={groupSelectorBottomSheetRef}
      />
      <ProphecyBottomSheet bottomSheetRef={prophecyBottomSheetRef} />
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  menuRow: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    right: 0,
    alignContent: 'center',
    padding: 0,
    marginBottom: 8,
  },
  gridButtonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  button: {
    padding: 0,
    borderRadius: 18,
    minWidth: 62,
    marginHorizontal: 8,
  },
  tooltipText: {
    flex: 1,
    flexGrow: 1,
    fontSize: 14,
  },
});

export default BottomBar;
