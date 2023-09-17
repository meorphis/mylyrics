// shows metadata for a song, including album art, song name, artist name, and
// album name

import {View, StyleSheet, Text, Image} from 'react-native';
import React from 'react';

import {SongType} from '../../types/song';
import ThemeType from '../../types/theme';
import {textStyleCommon} from '../../utility/text';
import {ScaleInfoType} from '../../utility/max_size';

type Props = {
  song: SongType;
  passageTheme: ThemeType;
  scaleInfo: ScaleInfoType;
};

const SongInfo = (props: Props) => {
  console.log(`rendering SongInfo ${props.song.name}`);

  const {song, passageTheme, scaleInfo} = props;

  const {scale, computed: scaleComputed} = scaleInfo;

  const {songNameSize, artistNameSize, albumNameSize, albumImageSize} = scale;

  const opacity = {opacity: scaleComputed ? 1 : 0};

  const textColor = passageTheme.textColors[0];

  return (
    <View style={{...styles.metadataRow, paddingBottom: songNameSize}}>
      <Image
        source={{uri: song.album.image.blob}}
        style={{
          ...{
            width: albumImageSize,
            height: albumImageSize,
          },
          ...opacity,
        }}
      />
      <View style={styles.metadataText}>
        <Text
          numberOfLines={2}
          style={{
            ...textStyleCommon,
            ...styles.songName,
            ...opacity,
            fontSize: songNameSize,
            color: textColor,
          }}>
          {song.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            ...textStyleCommon,
            ...opacity,
            fontSize: artistNameSize,
            color: textColor,
          }}>
          {song.artists.map(({name}) => name).join(', ')}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            ...textStyleCommon,
            ...opacity,
            fontSize: albumNameSize,
            color: textColor,
          }}>
          {song.album.name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metadataRow: {
    flexDirection: 'row',
    padding: 0,
    flex: 0,
    paddingBottom: 16,
  },
  metadataText: {
    flexDirection: 'column',
    flex: 1,
    marginLeft: 12,
  },
  songName: {
    fontWeight: 'bold',
  },
});

export default SongInfo;
