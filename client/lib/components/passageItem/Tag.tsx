// renders a single tag for a passage

import TagType from '../../types/tag';
import React from 'react';
import {useSetAsActiveGroup} from '../../utility/active_group';
import ThemeButton from '../common/ThemeButton';
import ThemeType from '../../types/theme';
import {ButtonColorChoice} from '../../utility/color';

type Props = {
  tag: TagType;
  theme: ThemeType;
  isActiveGroup: boolean;
  passageKey: string | null;
  includeEmoji?: boolean;
  onPress?: () => void;
};

const Tag = (props: Props) => {
  console.log(`rendering Tag ${props.passageKey} ${props.tag.sentiment}`);

  const {tag, theme, isActiveGroup, passageKey, onPress} = props;

  const setAsActiveGroup = useSetAsActiveGroup({
    passageKey,
    groupKey: tag.sentiment,
  });

  return (
    <ThemeButton
      text={tag.sentiment}
      theme={theme}
      colorChoice={
        isActiveGroup
          ? ButtonColorChoice.detailSaturated
          : ButtonColorChoice.detailUnsaturated
      }
      onPress={() => {
        if (onPress) {
          onPress();
        }
        setAsActiveGroup();
      }}
    />
  );
};

export default Tag;
