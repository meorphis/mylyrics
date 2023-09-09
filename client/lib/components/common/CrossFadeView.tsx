import React, {useLayoutEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

type Props = {
  renderContent: () => JSX.Element;
  trigger: string;
};

const CrossFadeView = (props: Props) => {
  const {renderContent, trigger} = props;

  const [oldContent, setOldContent] = useState<React.ReactNode>(null);
  const [newContent, setNewContent] = useState<React.ReactNode>(
    renderContent(),
  );

  const fadeAnimOld = useSharedValue(1);
  const fadeAnimNew = useSharedValue(0);

  const animatedStyleOld = useAnimatedStyle(() => {
    return {
      opacity: fadeAnimOld.value,
    };
  });

  const animatedStyleNew = useAnimatedStyle(() => {
    return {
      opacity: fadeAnimNew.value,
    };
  });

  useLayoutEffect(() => {
    setOldContent(newContent);
    setNewContent(renderContent());

    fadeAnimNew.value = 0;
    fadeAnimOld.value = withTiming(0, {duration: 500});
    fadeAnimNew.value = withTiming(1, {duration: 500});
  }, [trigger]);

  useLayoutEffect(() => {
    setNewContent(renderContent());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyleOld]}>
        {oldContent}
      </Animated.View>
      <Animated.View style={[styles.content, animatedStyleNew]}>
        {renderContent()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default CrossFadeView;
