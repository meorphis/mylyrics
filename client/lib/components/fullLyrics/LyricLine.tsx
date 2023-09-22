import {
  LayoutChangeEvent,
  Pressable,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import AppearingView from '../common/AppearingView';
import {SharedElement} from 'react-navigation-shared-element';
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

  const innerComponent = skipPressable ? (
    <View style={pressableStyle}>
      <Text style={textStyle}>{lineText}</Text>
    </View>
  ) : (
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
    <AppearingView duration={500}>{innerSharedComponent}</AppearingView>
  ) : null;
};

export default LyricLine;
