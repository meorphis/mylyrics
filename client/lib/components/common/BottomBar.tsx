import {StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../../utility/theme';
import ThemeButton from './ThemeButton';
import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import GroupSelectorBottomSheet from './GroupSelectorBottomSheet';
import ProphecyBottomSheet from './ProphecyBottomSheet/ProphecyBottomSheet';
import WalkthroughStepComponent from './WalkthroughStep';
import {useWalkthroughStep} from '../../utility/walkthrough';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSetActiveGroup} from '../../utility/active_passage';
import {
  allSentiments,
  sentimentAdjectiveToNoun,
} from '../../utility/sentiments';
import SentimentEnumType from '../../types/sentiments';
import {useSingletonPassage} from '../../utility/singleton_passage';

type Props = {
  activeGroupKey: string | null;
  style?: ViewStyle;
};

const BottomBar = (props: Props) => {
  const {activeGroupKey, style} = props;

  const groupSelectorBottomSheetRef = React.useRef<BottomSheet>(null);
  const prophecyBottomSheetRef = React.useRef<BottomSheet>(null);

  const setLikesAsActiveGroup = useSetActiveGroup({groupKey: 'likes'});
  const singletonPassage = useSingletonPassage();
  const setPreviousGroupKeyAsActiveGroup = useSetActiveGroup({
    groupKey: singletonPassage?.previousGroupKey ?? '',
  });

  const {theme} = useTheme();

  const {walkthroughStepStatus, setWalkthroughStepAsCompleted} =
    useWalkthroughStep('explore');

  return (
    <React.Fragment>
      <SafeAreaView style={{...styles.menuRow, ...style}}>
        {activeGroupKey === 'singleton_passage' && (
          <ThemeButton
            theme={theme}
            onPress={() => {
              setPreviousGroupKeyAsActiveGroup();
            }}
            iconName="arrow-back"
            textStyle={styles.gridButtonText}
            style={styles.button}
          />
        )}
        <WalkthroughStepComponent
          walkthroughStepStatus={walkthroughStepStatus}
          setWalkthroughStepAsCompleted={setWalkthroughStepAsCompleted}
          text="explore lyrics from your favorite songs grouped by emotional themes">
          <ThemeButton
            text={
              activeGroupKey &&
              allSentiments.includes(activeGroupKey as SentimentEnumType)
                ? sentimentAdjectiveToNoun(
                    activeGroupKey as SentimentEnumType,
                  ) ?? ''
                : ''
            }
            theme={theme}
            useSaturatedColor={allSentiments.includes(
              activeGroupKey as SentimentEnumType,
            )}
            onPress={() => {
              setWalkthroughStepAsCompleted();
              groupSelectorBottomSheetRef?.current?.expand();
            }}
            iconName="grid-outline"
            textStyle={styles.gridButtonText}
            style={styles.button}
          />
        </WalkthroughStepComponent>
        <ThemeButton
          theme={theme}
          useSaturatedColor={activeGroupKey === 'likes'}
          onPress={() => {
            setLikesAsActiveGroup();
          }}
          iconName="heart-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
        <ThemeButton
          theme={theme}
          onPress={() => {
            prophecyBottomSheetRef.current?.expand();
          }}
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
