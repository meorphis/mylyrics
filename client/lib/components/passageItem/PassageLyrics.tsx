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
import {ScrollView} from 'react-native-gesture-handler';

type Props = {
  song: SongType;
  lyrics: string;
  theme: ThemeType;
  sharedTransitionKey: string;
  onLayout: (event: LayoutChangeEvent) => void;
  viewRef: React.RefObject<View>;
};

const PassageLyrics = (props: Props) => {
  const {song, lyrics, theme, sharedTransitionKey, onLayout, viewRef} = props;

  const splitLyrics = splitLyricsWithPassages({
    songLyrics: cleanLyrics(song.lyrics),
    passageLyrics: lyrics,
  });

  return (
    <ScrollView bounces={false}>
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
                  style={{
                    ...textStyleCommon,
                    ...styles.lyricsLine,
                    color: getLyricsColor({theme}),
                  }}>
                  {lineText}
                </Text>
              </SharedElement>
            );
          })
          .filter(line => line !== null)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  lyricsLine: {
    fontSize: 18,
    color: 'lightgrey',
  },
});

export default PassageLyrics;
