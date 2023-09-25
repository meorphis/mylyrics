import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ThemeType from '../../../types/theme';
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

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
};

// base component to be used for buttons in the ActionBar
const ActionBarButton = (props: Props) => {
  const {onPress, theme, isDisabled, isActive, defaultState, activeState} =
    props;

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
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  });

  return (
    <AnimatedPressable
      style={[
        animatedStyle,
        styles.actionButton,
        isDisabled ? styles.disabled : {},
      ]}
      onPress={() => {
        if (isDisabled) {
          return;
        }

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
        });
      }}>
      <IconClass name={icon} size={40} color={theme.textColors[0]} />
      <Text style={{...styles.actionText, color: theme.textColors[0]}}>
        {text}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 10,
  },
});

export default ActionBarButton;
