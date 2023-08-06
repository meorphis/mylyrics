// this HOC is responsible for determining the theme for a PassageItem based on
// its album art and then setting the global theme if the passage is currently

import {memo, useEffect, useState} from 'react';
import PassageItem, {PassageItemProps} from '../passageItem/PassageItem';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import {useThemeUpdate} from '../../utility/theme';
import {ImageColorsResult, getColors} from 'react-native-image-colors';
import React from 'react';
import {PassageType} from '../../types/passage';

type WithPassageThemeProps = {
  passageItemKey: {
    passageKey: string;
    groupKey: string;
  };
  passage: PassageType | null;
};

const WithPassageTheme = (
  WrappedComponent: React.ComponentType<PassageItemProps>,
) => {
  const ThemedPassageItem: React.FC<WithPassageThemeProps> = props => {
    console.log('rendering ThemedPassageItem');

    const {passage} = props;
    const {image: imageUrl} = passage?.song.album || {
      image: null,
    };
    const passageIsActive = useSelector(
      (state: RootState) =>
        state.activePassage.passageKey === props.passageItemKey.passageKey &&
        state.activePassage.groupKey === props.passageItemKey.groupKey,
    );
    const updateGlobalTheme = useThemeUpdate();
    const [albumColors, setAlbumColors] = useState<ImageColorsResult | null>(
      null,
    );

    // get the colors for the album art
    useEffect(() => {
      if (imageUrl == null) {
        return;
      }
      getColors(imageUrl, {quality: 'high'}).then(colors => {
        console.log(`colors loaded for ${props.passageItemKey.passageKey}`);
        setAlbumColors(colors);
      });
    }, []);

    // albumColors behaves different on iOS and Android, so we need to normalize
    const theme = albumColors
      ? {
          primaryColor:
            albumColors.platform === 'ios'
              ? albumColors.primary
              : albumColors.vibrant,
          secondaryColor:
            albumColors.platform === 'ios'
              ? albumColors.secondary
              : albumColors.darkVibrant,
          backgroundColor:
            albumColors.platform === 'ios'
              ? albumColors.background
              : albumColors.muted,
          detailColor:
            albumColors.platform === 'ios'
              ? albumColors.detail
              : albumColors.darkMuted,
        }
      : undefined;

    // update the global theme is the passage has become active or the theme has
    // finished loading
    useEffect(() => {
      if (passageIsActive && theme) {
        updateGlobalTheme(theme);
      }
    }, [passageIsActive, theme != null]);

    return <WrappedComponent {...props} passageTheme={theme} />;
  };

  return ThemedPassageItem;
};

const ThemedPassageItem = memo(WithPassageTheme(PassageItem), () => true);

export default ThemedPassageItem;
