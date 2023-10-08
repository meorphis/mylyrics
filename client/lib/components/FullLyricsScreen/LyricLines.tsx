import LyricLine from './LyricLine';
import React from 'react';
import ThemeType from '../../types/theme';
import {isColorLight} from '../../utility/helpers/color';
import {textStyleCommon} from '../../utility/helpers/text';
import {StyleSheet} from 'react-native';
import tinycolor from 'tinycolor2';

type Props = {
  splitLyrics: {
    lineText: string;
    passageInfo: {
      passageStart: number;
      passageEnd: number;
      passageLine: number;
    } | null;
  }[];
  highlightedIndexes: number[];
  setHighlightedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
  onLayoutInitiallyHighlightedLyrics: (yPosition: number) => void;
  theme: ThemeType;
  sharedTransitionKey?: string;
  shouldShowAppearingText: boolean;
  skipAnimation?: boolean;
  skipPressable?: boolean;
};

// displays the lyrics of a song, with the ability to highlight certain lines
const LyricLines = (props: Props) => {
  const {
    splitLyrics,
    highlightedIndexes,
    setHighlightedIndexes,
    onLayoutInitiallyHighlightedLyrics,
    theme,
    sharedTransitionKey,
    shouldShowAppearingText,
    skipAnimation,
    skipPressable,
  } = props;

  const saturatedColor = isColorLight(theme.farBackgroundColor)
    ? '#000000'
    : '#ffffff';

  const getBackgroundColorForLineIndex = (i: number) => {
    if (highlightedIndexes.includes(i)) {
      return saturatedColor;
    } else if (
      highlightedIndexes.includes(i - 1) ||
      highlightedIndexes.includes(i + 1)
    ) {
      return tinycolor(saturatedColor).setAlpha(0.2).toRgbString();
    } else {
      return undefined;
    }
  };

  const getStylesForLineIndex = (i: number) => {
    const backgroundColor = getBackgroundColorForLineIndex(i);
    const isHighlighted = highlightedIndexes.includes(i);

    return {
      textStyle: {
        ...textStyleCommon,
        ...styles.lyricsLine,
        color: isHighlighted
          ? isColorLight(saturatedColor)
            ? 'black'
            : 'white'
          : theme.textColors[0],
      },
      pressableStyle: {
        ...styles.lyricsLineContainer,
        ...styles.activeLyricsLineContainer,
        backgroundColor,
      },
    };
  };

  return (
    <React.Fragment>
      {splitLyrics.map(({lineText, passageInfo}, index) => (
        <LyricLine
          key={index}
          index={index}
          lineText={lineText}
          isAppearingText={passageInfo == null && !skipAnimation}
          skipPressable={skipPressable}
          shouldShowAppearingText={shouldShowAppearingText}
          sharedTransitionKey={sharedTransitionKey}
          setAsHighlighted={() => {
            const nextLineIsHighlighted = highlightedIndexes.includes(
              index + 1,
            );
            const previousLineIsHighlighted = highlightedIndexes.includes(
              index - 1,
            );

            if (highlightedIndexes.includes(index)) {
              if (nextLineIsHighlighted && previousLineIsHighlighted) {
                setHighlightedIndexes([index]);
              } else {
                setHighlightedIndexes(indexes =>
                  indexes.filter(i => i !== index),
                );
              }
            } else {
              if (nextLineIsHighlighted) {
                setHighlightedIndexes(indexes => [index, ...indexes]);
              } else if (previousLineIsHighlighted) {
                setHighlightedIndexes(indexes => [...indexes, index]);
              } else {
                setHighlightedIndexes([index]);
              }
            }
          }}
          onLayout={event => {
            if (passageInfo?.passageLine === 0) {
              onLayoutInitiallyHighlightedLyrics(event.nativeEvent.layout.y);
            }
          }}
          {...getStylesForLineIndex(index)}
        />
      ))}
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  activeLyricsLineContainer: {
    borderRadius: 8,
  },
  lyricsLineContainer: {
    marginVertical: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  lyricsLine: {
    fontSize: 22,
  },
});

export default LyricLines;
