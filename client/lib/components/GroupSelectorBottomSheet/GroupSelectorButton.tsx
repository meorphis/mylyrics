// renders a single tag for a passage

import React, {memo} from 'react';
import ThemeButton from '../common/ThemeButton';
import {StyleSheet} from 'react-native';
import {bundleKeyDisplayName} from '../../utility/helpers/sentiments';
import {useDispatch} from 'react-redux';
import {requestBundleChange} from '../../utility/redux/requested_bundle_change/slice';
import SentimentEnumType from '../../types/sentiments';
import {useIsActiveBundle} from '../../utility/redux/bundles/selectors';

type Props = {
  bundleKey: string;
  onPress: () => void;
};

// a button to change the active bundle to the one specified
const GroupSelectorButton = (props: Props) => {
  console.log(`rendering GroupSelectorButton ${props.bundleKey}`);

  const {bundleKey, onPress} = props;

  const dispatch = useDispatch();
  const isActiveBundle = useIsActiveBundle(bundleKey);

  return (
    <ThemeButton
      text={bundleKeyDisplayName(bundleKey as SentimentEnumType)!}
      textStyle={styles.buttonText}
      textContainerStyle={styles.buttonTextContainer}
      useSaturatedColor={isActiveBundle}
      onPress={() => {
        // allow some time for the animation to close the bundle sheet since it
        // runs on JS and changing the bundle is expensive
        setTimeout(() => dispatch(requestBundleChange({bundleKey})), 50);

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
  },
  buttonTextContainer: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});

export default memo(GroupSelectorButton, () => true);
