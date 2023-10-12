// shows metadata for a song, including album art, song name, artist name, and
// album name

import {View, StyleSheet, Text} from 'react-native';
import React, {memo} from 'react';
import {textStyleCommon} from '../../utility/helpers/text';
import _ from 'lodash';
import {useScaleInfo} from '../../utility/redux/measurement/selectors';
import {PassageType} from '../../types/passage';
import {LyricCardMeasurementContext} from '../../types/measurement';
import AlbumArt from './AlbumArt';

type Props = {
  passage: PassageType;
  measurementContext: LyricCardMeasurementContext;
};

// shows some metadata about a song including name, artist, album and album art
const SongInfo = (props: Props) => {
  console.log(`rendering SongInfo ${props.passage.song.name}`);

  const {passage, measurementContext} = props;
  const {song, theme, passageKey} = passage;

  const {scale} = useScaleInfo({
    globalPassageKey: passageKey,
    context: measurementContext,
  });

  const {songNameSize, artistNameSize, albumNameSize, albumImageSize} = scale;

  const textColor = theme.textColors[0];

  return (
    <View style={{...styles.metadataRow, paddingBottom: songNameSize}}>
      <AlbumArt url={song.album.image.url} albumImageSize={albumImageSize} />
      <View style={styles.metadataText}>
        <Text
          numberOfLines={2}
          style={{
            ...textStyleCommon,
            ...styles.songName,
            fontSize: songNameSize,
            color: textColor,
          }}>
          {song.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            ...textStyleCommon,
            fontSize: artistNameSize,
            color: textColor,
          }}>
          {song.artists.map(({name}) => name).join(', ')}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            ...textStyleCommon,
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

export default memo(SongInfo, (prev, next) => {
  return _.isEqual(prev.passage.theme, next.passage.theme);
});
