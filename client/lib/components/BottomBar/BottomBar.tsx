import {StyleSheet, ViewStyle} from 'react-native';
import ThemeButton from '../common/ThemeButton';
import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import GroupSelectorBottomSheet from '../GroupSelectorBottomSheet/GroupSelectorBottomSheet';
import ProphecyBottomSheet from '../ProphecyBottomSheet/ProphecyBottomSheet';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  allSentiments,
  sentimentAdjectiveToNoun,
} from '../../utility/helpers/sentiments';
import SentimentEnumType from '../../types/sentiments';
import {
  useActiveBundleKey,
  usePreviouslyActiveBundleKey,
} from '../../utility/redux/bundles/selectors';
import {useDispatch} from 'react-redux';
import {requestBundleChange} from '../../utility/redux/requested_bundle_change/slice';

type Props = {
  style?: ViewStyle;
};

// set of buttons that allow the users to navigate between page elements
const BottomBar = (props: Props) => {
  const {style} = props;

  const groupSelectorBottomSheetRef = React.useRef<BottomSheet>(null);
  const prophecyBottomSheetRef = React.useRef<BottomSheet>(null);
  const activeBundleKey = useActiveBundleKey();
  const previouslyActiveBundleKey = usePreviouslyActiveBundleKey();
  const dispatch = useDispatch();

  return (
    <React.Fragment>
      <SafeAreaView style={{...styles.menuRow, ...style}}>
        {activeBundleKey === 'singleton_passage' &&
          previouslyActiveBundleKey && (
            <ThemeButton
              onPress={() => {
                dispatch(
                  requestBundleChange({bundleKey: previouslyActiveBundleKey}),
                );
              }}
              iconName="arrow-back"
              textStyle={styles.gridButtonText}
              style={styles.button}
            />
          )}
        <ThemeButton
          text={
            activeBundleKey &&
            allSentiments.includes(activeBundleKey as SentimentEnumType)
              ? sentimentAdjectiveToNoun(
                  activeBundleKey as SentimentEnumType,
                ) ?? ''
              : ''
          }
          useSaturatedColor={allSentiments.includes(
            activeBundleKey as SentimentEnumType,
          )}
          onPress={() => {
            groupSelectorBottomSheetRef?.current?.expand();
          }}
          iconName="grid-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
        <ThemeButton
          useSaturatedColor={activeBundleKey === 'likes'}
          onPress={() => {
            dispatch(requestBundleChange({bundleKey: 'likes'}));
          }}
          iconName="heart-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
        <ThemeButton
          onPress={() => {
            prophecyBottomSheetRef.current?.expand();
          }}
          iconName="eye-outline"
          textStyle={styles.gridButtonText}
          style={styles.button}
        />
      </SafeAreaView>
      <GroupSelectorBottomSheet bottomSheetRef={groupSelectorBottomSheetRef} />
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
