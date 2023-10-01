import {StyleSheet, ViewStyle} from 'react-native';
import ThemeButton from '../common/ThemeButton';
import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import GroupSelectorBottomSheet from '../GroupSelectorBottomSheet/GroupSelectorBottomSheet';
import ProphecyBottomSheet from '../ProphecyBottomSheet/ProphecyBottomSheet';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useActiveBundle,
  usePreviouslyActiveBundleKey,
} from '../../utility/redux/bundles/selectors';
import {useDispatch} from 'react-redux';
import {requestBundleChange} from '../../utility/redux/requested_bundle_change/slice';
import {getBundleEmoji} from '../../utility/helpers/sentiments';

type Props = {
  style?: ViewStyle;
};

// set of buttons that allow the users to navigate between page elements
const BottomBar = (props: Props) => {
  const {style} = props;

  const groupSelectorBottomSheetRef = React.useRef<BottomSheet>(null);
  const prophecyBottomSheetRef = React.useRef<BottomSheet>(null);
  const activeBundle = useActiveBundle();
  const previouslyActiveBundleKey = usePreviouslyActiveBundleKey();
  const dispatch = useDispatch();

  const shouldShowBackButton =
    (activeBundle.info.type === 'singleton' ||
      activeBundle.info.type === 'user_made') &&
    previouslyActiveBundleKey != null;
  const shouldShowGroupSelectorButton = activeBundle.info.type !== 'user_made';
  const shouldShowProphecyButton = activeBundle.info.type !== 'user_made';

  return (
    <React.Fragment>
      <SafeAreaView style={{...styles.menuRow, ...style}}>
        {shouldShowBackButton && (
          <ThemeButton
            onPress={() => {
              dispatch(
                requestBundleChange({bundleKey: previouslyActiveBundleKey}),
              );
            }}
            iconName={
              activeBundle.info.type === 'user_made' ? 'close' : 'arrow-back'
            }
            textStyle={styles.buttonText}
            style={styles.button}
          />
        )}
        {shouldShowGroupSelectorButton && (
          <ThemeButton
            text={getBundleEmoji(activeBundle.info) ?? undefined}
            useSaturatedColor
            onPress={() => {
              groupSelectorBottomSheetRef?.current?.expand();
            }}
            iconName="grid-outline"
            textStyle={styles.buttonText}
            textContainerStyle={styles.groupSelectorButtonTextContainer}
            style={styles.button}
          />
        )}
        {/* {shouldShowLikesButton && (
          <ThemeButton
            useSaturatedColor={activeBundleKey === 'likes'}
            onPress={() => {
              dispatch(requestBundleChange({bundleKey: 'likes'}));
            }}
            iconName="heart-outline"
            textStyle={styles.buttonText}
            style={styles.button}
          />
        )} */}
        {shouldShowProphecyButton && (
          <ThemeButton
            onPress={() => {
              prophecyBottomSheetRef.current?.expand();
            }}
            iconName="eye-outline"
            textStyle={styles.buttonText}
            style={styles.button}
          />
        )}
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
  buttonText: {
    fontSize: 20,
    fontWeight: '500',
  },
  groupSelectorButtonTextContainer: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.7,
    shadowRadius: 2,
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
