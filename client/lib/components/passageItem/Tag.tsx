// renders a single tag for a passage

import TagType from '../../types/tag';
import React from 'react';
import ThemeButton from '../common/ThemeButton';
import {StyleSheet} from 'react-native';
import {useSetActiveGroup} from '../../utility/active_passage';

type Props = {
  tag: TagType;
  isActiveGroup: boolean;
  includeEmoji?: boolean;
  onPress?: () => void;
};

const Tag = (props: Props) => {
  console.log(`rendering Tag ${props.tag.sentiment}`);

  const {tag, isActiveGroup, onPress} = props;

  const setActiveGroup = useSetActiveGroup({groupKey: tag.sentiment});

  return (
    <ThemeButton
      text={tag.sentiment}
      textStyle={styles.buttonText}
      useSaturatedColor={isActiveGroup}
      onPress={() => {
        if (onPress) {
          onPress();
        }
        setActiveGroup();
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
