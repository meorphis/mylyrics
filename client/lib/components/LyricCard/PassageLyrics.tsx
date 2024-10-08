import React, {memo, useRef} from 'react';
import {LayoutChangeEvent, StyleSheet, Text, View} from 'react-native';
import {textStyleCommon} from '../../utility/helpers/text';
import {splitLyricsWithPassages} from '../../utility/helpers/lyrics';
import _ from 'lodash';
import {PassageType} from '../../types/passage';
import {LyricCardMeasurementContext} from '../../types/measurement';
import {useScaleInfo} from '../../utility/redux/measurement/selectors';
import {useDispatch} from 'react-redux';
import {
  setContentHeight,
  setLyricsYPosition,
} from '../../utility/redux/measurement/slice';

type Props = {
  passage: PassageType;
  sharedTransitionKey: string;
  measurementContext: LyricCardMeasurementContext;
  containerRef: React.RefObject<View>;
  shouldUseAnalysis?: boolean;
};

// renders the lyrics for a passage, including performing some measurements that are
// used for scaling and aligning screen transitions
const PassageLyrics = (props: Props) => {
  console.log(`rendering PassageLyrics for ${props.passage.song.name}`);

  const {passage, measurementContext, containerRef, shouldUseAnalysis} = props;
  const {song, lyrics, theme, passageKey} = passage;
  const {scale, scaleFinalized} = useScaleInfo({
    globalPassageKey: passageKey,
    context: measurementContext,
  });

  const ref = useRef<View>(null);
  const dispatch = useDispatch();

  const splitLyrics = shouldUseAnalysis
    ? [
        {
          lineText: passage.analysis,
          passageInfo: {
            passageStart: 0,
            passageEnd: passage.analysis!.length,
            passageLine: 0,
          },
        },
      ]
    : splitLyricsWithPassages({
        songLyrics: song.lyrics,
        passageLyrics: lyrics,
      });

  const {lyricsFontSize} = scale;

  const onLayout = (height: number) => {
    ref.current?.measureLayout(containerRef.current!, (__, y) => {
      dispatch(
        setLyricsYPosition({
          globalPassageKey: passage.passageKey,
          context: measurementContext,
          value: y,
        }),
      );
    });

    dispatch(
      setContentHeight({
        globalPassageKey: passage.passageKey,
        context: measurementContext,
        // lyrics height + album image height + SongInfo bottom padding height
        value: height,
      }),
    );
  };

  return (
    <View
      style={shouldUseAnalysis ? styles.overflowScroll : styles.overflowHidden}
      onLayout={
        shouldUseAnalysis
          ? undefined
          : (event: LayoutChangeEvent) =>
              onLayout(event.nativeEvent.layout.height)
      }
      ref={ref}>
      {splitLyrics
        .map(({lineText, passageInfo}, index: number) => {
          if (passageInfo == null) {
            return null;
          }

          return (
            // <Animated.View
            //   key={index}
            //   sharedTransitionTag={`${sharedTransitionKey}:lyrics:${passageLine}:view`}>
            <Text
              // sharedTransitionTag={`${sharedTransitionKey}:lyrics:${passageLine}:text`}
              // sharedTransitionStyle={lyricsTransition}
              key={index}
              onLayout={
                shouldUseAnalysis
                  ? (event: LayoutChangeEvent) => {
                      const height = event.nativeEvent.layout.height;
                      setTimeout(() => onLayout(height), 200);
                    }
                  : undefined
              }
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                ...textStyleCommon,
                ...styles.lyricsLine,
                ...(shouldUseAnalysis ? styles.italics : {}),
                fontSize: lyricsFontSize,
                color: theme.textColors[0],
                opacity: scaleFinalized ? 1 : 0,
              }}>
              {lineText.slice(passageInfo.passageStart, passageInfo.passageEnd)}
            </Text>
            // </Animated.View>
          );
        })
        .filter(line => line !== null)}
    </View>
  );
};

// export const lyricsTransition = SharedTransition.custom(values => {
//   'worklet';
//   return {
//     width: withSpring(values.targetWidth, {duration: 100}),
//     height: withSpring(values.targetHeight, {duration: 100}),
//     originX: withSpring(values.targetOriginX, {duration: 100}),
//     originY: withSpring(values.targetOriginY, {duration: 100}),
//   };
// });

const styles = StyleSheet.create({
  overflowHidden: {
    overflow: 'hidden',
  },
  overflowScroll: {
    overflow: 'scroll',
  },
  lyricsLine: {
    color: 'lightgrey',
  },
  italics: {
    fontStyle: 'italic',
  },
});

export default memo(
  PassageLyrics,
  (prev, next) =>
    _.isEqual(prev.passage.theme, next.passage.theme) &&
    prev.passage.lyrics === next.passage.lyrics &&
    prev.shouldUseAnalysis === next.shouldUseAnalysis,
);
