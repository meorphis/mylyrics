// renders a single tag for a passage

import TagType from '../../types/tag';
import React from 'react';
import {useSetAsActiveGroup} from '../../utility/active_group';
import ThemeButton from '../common/ThemeButton';
import ThemeType from '../../types/theme';

type Props = {
  tag: TagType;
  theme: ThemeType;
  isActiveGroup: boolean;
  passageKey: string;
};

const Tag = (props: Props) => {
  console.log(`rendering Tag ${props.passageKey} ${props.tag.sentiment}`);

  const {tag, theme, isActiveGroup, passageKey} = props;

  const setAsActiveGroup = useSetAsActiveGroup({
    passageKey,
    groupKey: tag.sentiment,
  });

  return (
    <ThemeButton
      text={tag.sentiment}
      theme={theme}
      useSaturatedColor={isActiveGroup}
      onPress={setAsActiveGroup}
    />
  );
};

export default Tag;
