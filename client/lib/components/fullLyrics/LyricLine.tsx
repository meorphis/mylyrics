import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppearingView from '../common/AppearingView';
import React from 'react';
import {
  addColorOpacity,
  buttonColorsForTheme,
  isColorLight,
} from '../../utility/color';
import {getLyricsColor} from '../../utility/lyrics';
import {textStyleCommon} from '../../utility/text';
import ThemeType from '../../types/theme';
import {SharedElement} from 'react-navigation-shared-element';

type Props = {
  lineText: string;
  index: number;
  passageLineIndex: number | null;
  shouldShowAppearingText: boolean;
  theme: ThemeType;
  sharedTransitionKey: string;
  isHighlighted: boolean;
  adjacentLineIsHighlighted: boolean;
  setAsHighlighted: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

const LyricLine = (props: Props) => {
  const {
    lineText,
    index,
    passageLineIndex,
    shouldShowAppearingText,
    theme,
    sharedTransitionKey,
    isHighlighted,
    adjacentLineIsHighlighted,
    setAsHighlighted,
    onLayout,
  } = props;

  const {saturatedColor} = buttonColorsForTheme(theme);

  const textStyle = {
    ...textStyleCommon,
    ...styles.lyricsLine,
    color: isHighlighted
      ? isColorLight(saturatedColor)
        ? 'black'
        : 'white'
      : getLyricsColor({theme}),
  };

  const getBackgroundColorForLineIndex = () => {
    if (isHighlighted) {
      return saturatedColor;
    } else if (adjacentLineIsHighlighted) {
      return addColorOpacity(saturatedColor, 0.2);
    } else {
      return undefined;
    }
  };

  const pressableStyle = {
    ...styles.lyricsLineContainer,
    ...styles.activeLyricsLineContainer,
    backgroundColor: getBackgroundColorForLineIndex(),
  };

  const innerComponent = (
    <SharedElement id={`${sharedTransitionKey}:lyrics:${index}`}>
      <Pressable onPress={setAsHighlighted} style={pressableStyle}>
        <Text style={textStyle}>{lineText}</Text>
      </Pressable>
    </SharedElement>
  );

  if (passageLineIndex != null) {
    return <View onLayout={onLayout}>{innerComponent}</View>;
  }

  return (
    shouldShowAppearingText && (
      <AppearingView delay={50} duration={750}>
        {innerComponent}
      </AppearingView>
    )
  );
};

const styles = StyleSheet.create({
  activeLyricsLineContainer: {
    borderRadius: 8,
  },
  lyricsLineContainer: {
    marginVertical: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  lyricsLine: {
    fontSize: 20,
  },
});

export default LyricLine;
