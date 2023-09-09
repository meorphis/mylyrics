import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ThemeType from '../../types/theme';
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import WalkthroughStepComponent from '../common/WalkthroughStep';
import {useWalkthroughStep} from '../../utility/walkthrough';
import {WalkthroughStep} from '../../types/walkthrough';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onPress: () => void;
  icon: string;
  IconClass: React.ComponentType<any>;
  text: string;
  theme: ThemeType;
  isDisabled?: boolean;
  walkthroughStep?: {
    step: WalkthroughStep;
    text: string;
  };
  activeState?: {
    initialIsActive: boolean;
    activeText: string;
    activeIcon: string;
  };
};

const ActionBarButton = (props: Props) => {
  const Component = props.walkthroughStep
    ? ActionBarButtonWithWalkthroughStep
    : ActionBarButtonInner;

  return <Component {...props} />;
};

const ActionBarButtonWithWalkthroughStep = (props: Props) => {
  const {walkthroughStep} = props;

  const {walkthroughStepStatus, setWalkthroughStepAsCompleted} =
    useWalkthroughStep(walkthroughStep!.step);

  return (
    <WalkthroughStepComponent
      childrenWrapperStyle={styles.actionButton}
      walkthroughStepStatus={walkthroughStepStatus}
      setWalkthroughStepAsCompleted={setWalkthroughStepAsCompleted}
      text={walkthroughStep!.text}>
      <ActionBarButtonInner {...props} />
    </WalkthroughStepComponent>
  );
};

const ActionBarButtonInner = (props: Props) => {
  const {onPress, icon, IconClass, text, theme, isDisabled, activeState} =
    props;

  const [isActive, setIsActive] = useState<boolean | null>(
    activeState?.initialIsActive ?? null,
  );

  useEffect(() => {
    setIsActive(activeState?.initialIsActive ?? null);
  }, [activeState?.initialIsActive]);

  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => {
    return {
      ...styles.actionButton,
      ...(isDisabled ? {opacity: 0.5} : {}),
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  });

  return (
    <AnimatedPressable
      style={style}
      onPress={() => {
        if (isDisabled) {
          return;
        }

        if (isActive != null) {
          setIsActive(a => !a);
        }

        scale.value = withSpring(
          1.1,
          {duration: 50},
          () =>
            (scale.value = withTiming(1, {duration: 200}, runOnJS(onPress))),
        );
      }}>
      <IconClass
        name={isActive ? activeState?.activeIcon : icon}
        size={36}
        color={theme.detailColor}
      />
      <Text style={{...styles.actionText, color: theme.detailColor}}>
        {isActive ? activeState?.activeText : text}
      </Text>
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
