import React, {memo} from 'react';
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
import _ from 'lodash';
import {ScaleType} from '../../utility/max_size';

type Props = {
  song: SongType;
  lyrics: string;
  theme: ThemeType;
  scale: ScaleType;
  scaleFinalized: boolean;
  sharedTransitionKey: string;
  onLayout: (event: LayoutChangeEvent) => void;
  viewRef: React.RefObject<View>;
};

const PassageLyrics = (props: Props) => {
  console.log(`rendering PassageLyrics ${props.song.name}`);

  const {
    song,
    lyrics,
    theme,
    scale,
    scaleFinalized,
    sharedTransitionKey,
    onLayout,
    viewRef,
  } = props;

  const splitLyrics = splitLyricsWithPassages({
    songLyrics: cleanLyrics(song.lyrics),
    passageLyrics: lyrics,
  });

  const {lyricsFontSize} = scale;

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
                  opacity: scaleFinalized ? 1 : 0,
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

export default memo(
  PassageLyrics,
  (prev, next) =>
    _.isEqual(prev.theme, next.theme) &&
    _.isEqual(prev.scale, next.scale) &&
    prev.scaleFinalized === next.scaleFinalized &&
    prev.lyrics === next.lyrics,
);
