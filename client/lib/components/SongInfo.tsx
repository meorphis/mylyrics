// shows metadata for a song, including album art, song name, artist name, and
// album name

import {View, StyleSheet} from 'react-native';
import StyledText from './StyledText';
import React from 'react';

import SongType from '../types/song';
import ThemeType from '../types/theme';

type Props = {
  song: SongType;
  passageTheme: ThemeType;
  loadedImage: React.JSX.Element;
};

const SongInfo = (props: Props) => {
  const {song, passageTheme, loadedImage} = props;

  const {
    primaryColor: songNameColor,
    secondaryColor: artistNameColor,
    detailColor: albumNameColor,
  } = passageTheme;

  return (
    <View style={styles.metadataRow}>
      {loadedImage}
      <View style={styles.metadataText}>
        <StyledText style={{...styles.songName, color: songNameColor}}>
          {song.name}
        </StyledText>
        <StyledText style={{...styles.artistName, color: artistNameColor}}>
          {song.artist.names.join(', ')}
        </StyledText>
        <StyledText style={{...styles.albumName, color: albumNameColor}}>
          {song.album.name}
        </StyledText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metadataRow: {
    flexDirection: 'row',
    padding: 10,
  },
  metadataText: {
    marginLeft: 10,
  },
  songName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  artistName: {
    fontSize: 16,
  },
  albumName: {
    fontSize: 14,
  },
});

export default SongInfo;
