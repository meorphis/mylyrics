import React from 'react';
import {View, Image} from 'react-native';
import {useAlbumArt} from '../../utility/redux/album_art/selectors';

type Props = {
  url: string;
  albumImageSize: number;
};

const AlbumArt = (props: Props) => {
  const {url, albumImageSize} = props;
  const imageBlob = useAlbumArt(url);

  return imageBlob ? (
    <Image
      source={{uri: imageBlob}}
      style={{
        width: albumImageSize,
        height: albumImageSize,
      }}
    />
  ) : (
    <View
      style={{
        width: albumImageSize,
        height: albumImageSize,
      }}
    />
  );
};

export default AlbumArt;
