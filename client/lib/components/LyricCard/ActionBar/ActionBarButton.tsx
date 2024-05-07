import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ThemeType from '../../../types/theme';
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {trigger as triggerHapticFeedback} from 'react-native-haptic-feedback';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onPress: () => void;
  theme: ThemeType;
  defaultState: {
    text: string;
    icon: string;
    IconClass: React.ComponentType<any>;
  };
  isActive?: boolean;
  activeState?: {
    text: string;
    icon: string;
    IconClass: React.ComponentType<any>;
  };
  isDisabled?: boolean;
  disableIfActive?: boolean;
};

// base component to be used for buttons in the ActionBar
const ActionBarButton = (props: Props) => {
  const {
    onPress,
    theme,
    defaultState,
    isActive,
    activeState,
    isDisabled: isDisabledProp,
    disableIfActive,
  } = props;

  const isDisabled = isDisabledProp || (disableIfActive && isActive);

  if (isActive != null && activeState == null) {
    throw new Error(
      'initialIsActive must be null if activeState is not provided',
    );
  }

  // we use optmisticIsActive to do optimistic updates, toggling the local state before
  // the state provided as a prop is updated - but once the prop is updated we update
  // it here as well
  const [optmisticIsActive, setIsOptimisticActive] = useState<boolean | null>(
    isActive ?? null,
  );
  useEffect(() => {
    setIsOptimisticActive(isActive ?? null);
  }, [isActive]);

  const {text, icon, IconClass} = optmisticIsActive
    ? activeState!
    : defaultState;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(isDisabled ? 0.5 : 1);
  useEffect(() => {
    if (isDisabled) {
      opacity.value = withTiming(0.5, {duration: 200});
    } else {
      opacity.value = 1;
    }
  }, [isDisabled]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value,
        },
      ],
      opacity: opacity.value,
    };
  });

  const inner = (
    <React.Fragment>
      <IconClass name={icon} size={40} color={theme.textColors[0]} />
      <Text style={{...styles.actionText, color: theme.textColors[0]}}>
        {text}
      </Text>
    </React.Fragment>
  );

  if (isDisabled) {
    return <View style={styles.actionButton}>{inner}</View>;
  }

  return (
    <AnimatedPressable
      style={[animatedStyle, styles.actionButton]}
      onPress={() => {
        if (isDisabled) {
          return;
        }

        triggerHapticFeedback('impactLight');

        if (isActive != null) {
          setIsOptimisticActive(a => !a);
        }

        requestAnimationFrame(() => {
          scale.value = withSpring(
            1.1,
            {duration: 50},
            () =>
              (scale.value = withTiming(1, {duration: 200}, runOnJS(onPress))),
          );
          if (disableIfActive) {
            opacity.value = withTiming(0.5, {duration: 200});
          }
        });
      }}>
      {inner}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
  },
});

export default ActionBarButton;
