import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppearingView from '../common/AppearingView';
import React from 'react';
import {addColorOpacity, isColorLight} from '../../utility/color';
import {getLyricsColor} from '../../utility/lyrics';
import {textStyleCommon} from '../../utility/text';
import ThemeType from '../../types/theme';
import {SharedElement} from 'react-navigation-shared-element';

type Props = {
  lineText: string;
  index: number;
  isAppearingText: boolean;
  shouldShowAppearingText: boolean;
  theme: ThemeType;
  sharedTransitionKey?: string;
  isHighlighted: boolean;
  adjacentLineIsHighlighted: boolean;
  setAsHighlighted: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

const LyricLine = (props: Props) => {
  const {
    lineText,
    index,
    isAppearingText,
    shouldShowAppearingText,
    theme,
    sharedTransitionKey,
    isHighlighted,
    adjacentLineIsHighlighted,
    setAsHighlighted,
    onLayout,
  } = props;

  const saturatedColor = isColorLight(theme.farBackgroundColor)
    ? '#000000'
    : '#ffffff';

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
    <Pressable onPress={setAsHighlighted} style={pressableStyle}>
      <Text style={textStyle}>{lineText}</Text>
    </Pressable>
  );

  const innerSharedComponent = sharedTransitionKey ? (
    <SharedElement id={`${sharedTransitionKey}:lyrics:${index}`}>
      {innerComponent}
    </SharedElement>
  ) : (
    innerComponent
  );

  if (!isAppearingText) {
    return <View onLayout={onLayout}>{innerSharedComponent}</View>;
  }

  return shouldShowAppearingText ? (
    <AppearingView duration={250}>{innerSharedComponent}</AppearingView>
  ) : null;
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
