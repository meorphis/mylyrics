// this HOC is responsible for determining the theme for a PassageItem based on
// its album art and then setting the global theme if the passage is currently

import {memo, useEffect} from 'react';
import {useThemeUpdate} from '../../utility/theme';
import React from 'react';
import {PassageType} from '../../types/passage';
import {getPassageId} from '../../utility/passage_id';
import {WithSharedTransitionKey} from './WithSharedTransitionKey';
import PassageItem, {
  PassageItemPropsWithoutSharedTransitionKey,
} from './PassageItem';
import {useShareablePassageUpdate} from '../../utility/shareable_passage';
import {WithPassageItemMeasurement} from './WithPassageItemMeasurement';

export type WithPassageThemeProps = {
  passage: PassageType;
  passageIsActive: boolean;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
};

const WithSetAsActive = (
  WrappedComponent: React.ComponentType<PassageItemPropsWithoutSharedTransitionKey>,
) => {
  const SetAsActivePassageItem = (props: WithPassageThemeProps) => {
    console.log(
      `rendering SetAsActivePassageItem ${getPassageId(props.passage)}`,
    );

    const {passage, passageIsActive} = props;

    const updateGlobalTheme = useThemeUpdate();
    const {setShareablePassage} = useShareablePassageUpdate();

    // update the global theme is the passage has become active
    useEffect(() => {
      if (passageIsActive) {
        updateGlobalTheme(passage.theme);

        // setting the shareable passage is a somewhat heavy operation, and we
        // want to make sure the animation from the global theme update happens
        // quickly, so we delay the shareable passage update by 250ms to free
        // up the JS thread to start the animation
        setTimeout(() => {
          setShareablePassage(passage);
        }, 250);
      }
    }, [passageIsActive]);

    return <WrappedComponent {...props} />;
  };

  return SetAsActivePassageItem;
};

const SelectedPassageItem = memo(
  WithSetAsActive(
    WithSharedTransitionKey(WithPassageItemMeasurement(PassageItem)),
  ),
  (prevProps, nextProps) => {
    // only re-render if passage goes in or out of active state and global theme needs to be updated
    return prevProps.passageIsActive === nextProps.passageIsActive;
  },
);

export default SelectedPassageItem;
