// this HOC is responsible for determining the theme for a PassageItem based on
// its album art and then setting the global theme if the passage is currently

import {memo, useEffect} from 'react';
import {useThemeUpdate} from '../../utility/theme';
import React from 'react';
import {PassageType} from '../../types/passage';
import {getPassageId} from '../../utility/passage_id';
import SharedTransitionPassageItem from './SharedTransitionPassageItem';
import {PassageItemPropsWithoutSharedTransitionKey} from './PassageItem';

export type WithPassageThemeProps = {
  passage: PassageType;
  passageIsActive: boolean;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
};

const WithPassageTheme = (
  WrappedComponent: React.ComponentType<PassageItemPropsWithoutSharedTransitionKey>,
) => {
  const ThemedPassageItem = (props: WithPassageThemeProps) => {
    console.log(`rendering ThemedPassageItem ${getPassageId(props.passage)}`);

    const {passage, passageIsActive} = props;

    const updateGlobalTheme = useThemeUpdate();

    // update the global theme is the passage has become active
    useEffect(() => {
      if (passageIsActive) {
        updateGlobalTheme(passage.theme);
      }
    }, [passageIsActive]);

    return <WrappedComponent {...props} />;
  };

  return ThemedPassageItem;
};

const ThemedPassageItem = memo(
  WithPassageTheme(SharedTransitionPassageItem),
  (prevProps, nextProps) => {
    // only re-render if passage goes in or out of active state and global theme needs to be updated
    return prevProps.passageIsActive === nextProps.passageIsActive;
  },
);

export default ThemedPassageItem;
