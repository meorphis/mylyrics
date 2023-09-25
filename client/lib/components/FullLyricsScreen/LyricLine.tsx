import {
  LayoutChangeEvent,
  Pressable,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import AppearingView from '../common/AppearingView';
import React from 'react';

type Props = {
  lineText: string;
  index: number;
  isAppearingText: boolean;
  shouldShowAppearingText: boolean;
  skipPressable?: boolean;
  textStyle: TextStyle;
  pressableStyle: ViewStyle;
  sharedTransitionKey?: string;
  setAsHighlighted: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

// a single line of lyrics
const LyricLine = (props: Props) => {
  const {
    lineText,
    index,
    isAppearingText,
    shouldShowAppearingText,
    textStyle,
    pressableStyle,
    skipPressable,
    sharedTransitionKey,
    setAsHighlighted,
    onLayout,
  } = props;

  const text = sharedTransitionKey ? (
    // <Animated.View
    //   key={index}
    //   // sharedTransitionTag={`${sharedTransitionKey}:lyrics:${index}:view`}
    // >
    <Text
      key={index}
      // sharedTransitionTag={`${sharedTransitionKey}:lyrics:${index}:text`}
      style={textStyle}
      // sharedTransitionStyle={lyricsTransition}
    >
      {lineText}
    </Text> // </Animated.View>
  ) : (
    <Text style={textStyle}>{lineText}</Text>
  );

  const innerComponent = skipPressable ? (
    <View style={pressableStyle}>{text}</View>
  ) : (
    <Pressable onPress={setAsHighlighted} style={pressableStyle}>
      {text}
    </Pressable>
  );

  if (!isAppearingText) {
    return <View onLayout={onLayout}>{innerComponent}</View>;
  }

  return shouldShowAppearingText ? (
    <AppearingView duration={500}>{innerComponent}</AppearingView>
  ) : null;
};

export default LyricLine;
