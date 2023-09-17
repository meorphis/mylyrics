// renders a single tag for a passage

import TagType from '../../types/tag';
import React from 'react';
import {useSetAsActiveGroup} from '../../utility/active_group';
import ThemeButton from '../common/ThemeButton';
import {StyleSheet} from 'react-native';

type Props = {
  tag: TagType;
  isActiveGroup: boolean;
  passageKey: string | null;
  includeEmoji?: boolean;
  onPress?: () => void;
};

const Tag = (props: Props) => {
  console.log(`rendering Tag ${props.passageKey} ${props.tag.sentiment}`);

  const {tag, isActiveGroup, passageKey, onPress} = props;

  const setAsActiveGroup = useSetAsActiveGroup({
    passageKey,
    groupKey: tag.sentiment,
  });

  return (
    <ThemeButton
      text={tag.sentiment}
      textStyle={styles.buttonText}
      useSaturatedColor={isActiveGroup}
      onPress={() => {
        if (onPress) {
          onPress();
        }
        setAsActiveGroup();
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

export default Tag;
