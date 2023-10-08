// renders a single tag for a passage

import React, {memo} from 'react';
import ThemeButton from '../common/ThemeButton';
import {StyleSheet} from 'react-native';
import {
  getBundleDisplayName,
  getBundleEmoji,
} from '../../utility/helpers/sentiments';
import {useDispatch} from 'react-redux';
import {requestBundleChange} from '../../utility/redux/requested_bundle_change/slice';
import {useIsActiveBundle} from '../../utility/redux/bundles/selectors';
import {BundleInfo} from '../../types/bundle';

type Props = {
  bundleInfo: BundleInfo;
  onPress: () => void;
};

// a button to change the active bundle to the one specified
const GroupSelectorButton = (props: Props) => {
  console.log(`rendering GroupSelectorButton ${props.bundleInfo.key}`);

  const {bundleInfo, onPress} = props;

  const dispatch = useDispatch();
  const isActiveBundle = useIsActiveBundle(bundleInfo.key);

  const displayName = getBundleDisplayName(bundleInfo);
  const fullDisplayName =
    displayName && isActiveBundle
      ? `${displayName} ${getBundleEmoji(bundleInfo)}`
      : displayName;

  return (
    <ThemeButton
      text={fullDisplayName ?? undefined}
      textStyle={styles.buttonText}
      useSaturatedColor={isActiveBundle}
      onPress={() => {
        // allow some time for the animation to close the bundle sheet since it
        // runs on JS and changing the bundle is expensive
        setTimeout(
          () => dispatch(requestBundleChange({bundleKey: bundleInfo.key})),
          50,
        );

        if (onPress) {
          onPress();
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});

export default memo(GroupSelectorButton, () => true);
