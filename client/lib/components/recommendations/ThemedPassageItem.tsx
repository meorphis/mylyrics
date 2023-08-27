// this HOC is responsible for determining the theme for a PassageItem based on
// its album art and then setting the global theme if the passage is currently

import {memo, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import {useThemeUpdate} from '../../utility/theme';
import React from 'react';
import {PassageType, RawPassageType} from '../../types/passage';
import _ from 'lodash';
import {ActivityIndicator} from 'react-native';
import ItemContainer from '../common/ItemContainer';
import ViewShotPassageItem, {
  ViewShotPassageItemProps,
} from '../passageItem/ViewShotPassageItem';

type WithPassageThemeProps = {
  passageItemKey: {
    passageKey: string;
    groupKey: string;
  };
  passage: RawPassageType;
};

const WithPassageTheme = (
  WrappedComponent: React.ComponentType<ViewShotPassageItemProps>,
) => {
  const ThemedPassageItem: React.FC<WithPassageThemeProps> = props => {
    console.log('rendering ThemedPassageItem');

    const {image} = props.passage.song.album;

    const imageData = useSelector(
      (state: RootState) => state.imageData[image],
      _.isEqual,
    );

    const passageIsActive = useSelector(
      (state: RootState) =>
        state.activePassage.passageKey === props.passageItemKey.passageKey &&
        state.activePassage.groupKey === props.passageItemKey.groupKey,
    );
    const updateGlobalTheme = useThemeUpdate();

    // albumColors behaves different on iOS and Android, so we need to normalize
    const theme = imageData
      ? {
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
        }
      : null;

    // update the global theme is the passage has become active
    useEffect(() => {
      if (passageIsActive && theme) {
        updateGlobalTheme(theme);
      }
    }, [passageIsActive, theme != null]);

    if (imageData == null) {
      return (
        <ItemContainer>
          <ActivityIndicator />
        </ItemContainer>
      );
    }

    const passage = {
      ...props.passage,
      song: {
        ...props.passage.song,
        album: {
          ...props.passage.song.album,
          image: imageData,
        },
      },
    } as PassageType;

    return (
      <WrappedComponent {...props} passage={passage} passageTheme={theme!} />
    );
  };

  return ThemedPassageItem;
};

const ThemedPassageItem = memo(
  WithPassageTheme(ViewShotPassageItem),
  () => true,
);

export default ThemedPassageItem;
