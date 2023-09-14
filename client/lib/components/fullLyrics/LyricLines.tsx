import LyricLine from './LyricLine';
import React from 'react';
import ThemeType from '../../types/theme';

type Props = {
  splitLyrics: {
    lineText: string;
    passageStart: number | null;
    passageEnd: number | null;
    passageLine: number | null;
  }[];
  highlightedIndexes: number[];
  setHighlightedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
  onLayoutInitiallyHighlightedLyrics: (yPosition: number) => void;
  theme: ThemeType;
  sharedTransitionKey?: string;
  shouldShowAppearingText: boolean;
  skipAnimation?: boolean;
};

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
  } = props;

  return (
    <React.Fragment>
      {splitLyrics.map(({lineText, passageLine}, index) => (
        <LyricLine
          key={index}
          index={index}
          lineText={lineText}
          isAppearingText={passageLine == null && !skipAnimation}
          shouldShowAppearingText={shouldShowAppearingText}
          theme={theme}
          sharedTransitionKey={sharedTransitionKey}
          isHighlighted={highlightedIndexes.includes(index)}
          adjacentLineIsHighlighted={
            highlightedIndexes.includes(index - 1) ||
            highlightedIndexes.includes(index + 1)
          }
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
            if (passageLine === 0) {
              onLayoutInitiallyHighlightedLyrics(event.nativeEvent.layout.y);
            }
          }}
        />
      ))}
    </React.Fragment>
  );
};

export default LyricLines;
