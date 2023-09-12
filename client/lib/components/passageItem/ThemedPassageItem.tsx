// this HOC is responsible for determining the theme for a PassageItem based on
// its album art and then setting the global theme if the passage is currently

import {memo, useEffect} from 'react';
import {useThemeUpdate} from '../../utility/theme';
import React from 'react';
import {PassageType} from '../../types/passage';
import {getPassageId} from '../../utility/passage_id';
import {PassageItemProps} from './PassageItem';
import ScaleProviderPassageItem from './ScaleProviderPassageItem';

export type WithPassageThemeProps = {
  passage: PassageType;
  passageIsActive: boolean;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
};

const WithPassageTheme = (
  WrappedComponent: React.ComponentType<PassageItemProps>,
) => {
  const ThemedPassageItem = (props: WithPassageThemeProps) => {
    console.log(`rendering ThemedPassageItem ${getPassageId(props.passage)}`);

    const {passage, passageIsActive} = props;
    const {image: imageData} = passage.song.album;

    const updateGlobalTheme = useThemeUpdate();

    // albumColors behaves different on iOS and Android, so we need to normalize
    const theme = {
      primaryColor:
        imageData.colors.platform === 'ios'
          ? imageData.colors.primary
          : imageData.colors.vibrant,
      secondaryColor:
        imageData.colors.platform === 'ios'
          ? imageData.colors.secondary
          : imageData.colors.darkVibrant,
      backgroundColor:
        imageData.colors.platform === 'ios'
          ? imageData.colors.background
          : imageData.colors.muted,
      detailColor:
        imageData.colors.platform === 'ios'
          ? imageData.colors.detail
          : imageData.colors.darkMuted,
    };

    // update the global theme is the passage has become active
    useEffect(() => {
      if (passageIsActive && theme) {
        updateGlobalTheme(theme);
      }
    }, [passageIsActive]);

    return <WrappedComponent {...props} passageTheme={theme!} />;
  };

  return ThemedPassageItem;
};

const ThemedPassageItem = memo(
  WithPassageTheme(ScaleProviderPassageItem),
  (prevProps, nextProps) => {
    // only re-render if passage goes in or out of active state and global theme needs to be updated
    return prevProps.passageIsActive === nextProps.passageIsActive;
  },
);

export default ThemedPassageItem;
