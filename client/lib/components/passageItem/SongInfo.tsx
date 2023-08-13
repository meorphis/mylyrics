// shows metadata for a song, including album art, song name, artist name, and
// album name

import {View, StyleSheet, Text, Image} from 'react-native';
import React from 'react';

import {SongType} from '../../types/song';
import ThemeType from '../../types/theme';
import {textStyleCommon} from '../../utility/text';

type Props = {
  song: SongType;
  passageTheme: ThemeType;
};

const SongInfo = (props: Props) => {
  console.log(`rendering SongInfo ${props.song.name}`);

  const {song, passageTheme} = props;

  const {
    primaryColor: songNameColor,
    secondaryColor: artistNameColor,
    detailColor: albumNameColor,
  } = passageTheme;

  return (
    <View style={styles.metadataRow}>
      <Image source={{uri: song.album.image.blob}} style={styles.albumImage} />
      <View style={styles.metadataText}>
        <Text
          numberOfLines={2}
          style={{
            ...textStyleCommon,
            ...styles.songName,
            color: songNameColor,
          }}>
          {song.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{...styles.artistName, color: artistNameColor}}>
          {song.artists.map(({name}) => name).join(', ')}
        </Text>
        <Text
          numberOfLines={1}
          style={{...styles.albumName, color: albumNameColor}}>
          {song.album.name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  albumImage: {
    width: 100,
    height: 100,
  },
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistName: {
    fontSize: 14,
  },
  albumName: {
    fontSize: 13,
  },
});

export default SongInfo;
