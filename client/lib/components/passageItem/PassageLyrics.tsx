import React from 'react';
import {LayoutChangeEvent, StyleSheet, Text, View} from 'react-native';
import {textStyleCommon} from '../../utility/text';
import ThemeType from '../../types/theme';
import {
  cleanLyrics,
  getLyricsColor,
  splitLyricsWithPassages,
} from '../../utility/lyrics';
import {SharedElement} from 'react-navigation-shared-element';
import {SongType} from '../../types/song';
import {ScaleType} from '../../utility/max_size';

type Props = {
  song: SongType;
  lyrics: string;
  theme: ThemeType;
  scale: ScaleType;
  sharedTransitionKey: string;
  onLayout: (event: LayoutChangeEvent) => void;
  viewRef: React.RefObject<View>;
};

const PassageLyrics = (props: Props) => {
  const {song, lyrics, theme, scale, sharedTransitionKey, onLayout, viewRef} =
    props;

  const splitLyrics = splitLyricsWithPassages({
    songLyrics: cleanLyrics(song.lyrics),
    passageLyrics: lyrics,
  });

  const {lyricsFontSize, contentReady} = scale;

  return (
    <View style={styles.container} onLayout={onLayout} ref={viewRef}>
      {splitLyrics
        .map(({lineText, passageLine}, index) => {
          if (passageLine == null) {
            return null;
          }

          return (
            <SharedElement
              key={index}
              id={`${sharedTransitionKey}:lyrics:${index}`}>
              <Text
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                  ...textStyleCommon,
                  ...styles.lyricsLine,
                  fontSize: lyricsFontSize,
                  color: getLyricsColor({theme}),
                  opacity: contentReady ? 1 : 0,
                }}>
                {lineText}
              </Text>
            </SharedElement>
          );
        })
        .filter(line => line !== null)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  lyricsLine: {
    color: 'lightgrey',
  },
});

export default PassageLyrics;
