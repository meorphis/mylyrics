// this HOC is responsible for determining the theme for a PassageItem based on
// its album art and then setting the global theme if the passage is currently

import {memo} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import React from 'react';
import {PassageType, RawPassageType} from '../../types/passage';
import _ from 'lodash';
import ThemedPassageItem, {
  WithPassageThemeProps,
} from '../passageItem/ThemedPassageItem';

type WithImageDataProps = {
  passage: RawPassageType;
  passageIsActive: boolean;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
};

const WithImageData = (
  WrappedComponent: React.ComponentType<WithPassageThemeProps>,
) => {
  const ImageDataPassageItem: React.FC<WithImageDataProps> = props => {
    console.log('rendering ThemedPassageItem');

    const {image} = props.passage.song.album;

    const imageData = useSelector(
      (state: RootState) => state.imageData[image],
      _.isEqual,
    );

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

    return <WrappedComponent {...props} passage={passage} />;
  };

  return ImageDataPassageItem;
};

const ImageDataPassageItem = memo(
  WithImageData(ThemedPassageItem),
  (prevProps, nextProps) => {
    // only re-render if passage goes in or out of active state and global theme needs to be updated
    return prevProps.passageIsActive === nextProps.passageIsActive;
  },
);

export default ImageDataPassageItem;
