// renders a single tag for a passage

import React, {memo} from 'react';
import ThemeButton from '../common/ThemeButton';
import {StyleSheet} from 'react-native';
import {sentimentAdjectiveToNoun} from '../../utility/helpers/sentiments';
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
      text={sentimentAdjectiveToNoun(bundleKey as SentimentEnumType)!}
      textStyle={styles.buttonText}
      useSaturatedColor={isActiveBundle}
      onPress={() => {
        dispatch(requestBundleChange({bundleKey}));

        if (onPress) {
          onPress();
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default memo(GroupSelectorButton, () => true);
