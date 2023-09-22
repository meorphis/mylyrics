// renders a single tag for a passage

import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Ionicon from 'react-native-vector-icons/Ionicons';
import React from 'react';
import {textStyleCommon} from '../../utility/text';
import ThemeType from '../../types/theme';

type Props = {
  text?: string;
  theme?: ThemeType;
  useSaturatedColor?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  iconName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const ThemeButton = (props: Props) => {
  const {
    text,
    useSaturatedColor = false,
    isDisabled,
    onPress,
    iconName,
    style,
    textStyle,
  } = props;

  const borderColor = useSaturatedColor ? '#ffffff80' : '#00000040';
  const textColor = useSaturatedColor ? 'white' : 'black';

  return (
    <TouchableOpacity
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        ...styles.button,
        ...style,
        ...(useSaturatedColor ? styles.saturated : styles.unsaturated),
        opacity: isDisabled ? 0.15 : 1,
        borderColor,
      }}
      onPress={onPress}
      disabled={isDisabled}>
      <SolidBackground {...props}>
        {iconName && <Ionicon name={iconName} size={24} color={textColor} />}
        {iconName && text && <View style={styles.textIconPadding} />}
        {text && (
          <Text
            style={{
              ...textStyleCommon,
              ...styles.text,
              ...textStyle,
              color: textColor,
            }}>
            {text}
          </Text>
        )}
      </SolidBackground>
    </TouchableOpacity>
  );
};

const SolidBackground = (
  props: Props & {
    children: React.ReactNode;
  },
) => {
  const {useSaturatedColor, children} = props;

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        ...styles.solidBackground,
        backgroundColor: useSaturatedColor ? 'black' : 'white',
      }}>
      {children}
    </View>
  );
};

// const GradientBackground = (
//   props: Props & {
//     children: React.ReactNode;
//   },
// ) => {
//   const {useSaturatedColor, children} = props;

//   const {interpolatedColors} = useTheme();

//   const sharedValue = useSharedValue(0);
//   const sharedWhiteBlack = useDerivedValue(() =>
//     ['white', 'black'].map(c =>
//       interpolateColor(sharedValue.value, [0, 1], [c, 'red']),
//     ),
//   );
//   const sharedUseSaturatedColor = useSharedValue(useSaturatedColor);

//   useEffect(() => {
//     sharedUseSaturatedColor.value = useSaturatedColor;
//   }, [useSaturatedColor]);

//   const derivedColors = useDerivedValue(() =>
//     sharedUseSaturatedColor.value
//       ? [sharedWhiteBlack.value[1], interpolatedColors.value[0]]
//       : [interpolatedColors.value[0], sharedWhiteBlack.value[0]],
//   );

//   console.log('DERIVED COLORS', derivedColors);

//   return (
//     <AnimatedLinearGradient
//       style={styles.gradientBackground}
//       start={{x: -0.5, y: -0.5}}
//       end={{x: 1, y: 1}}
//       interpolatedColors={derivedColors}>
//       {children}
//     </AnimatedLinearGradient>
//   );
// };

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
  },
  unsaturated: {
    borderWidth: 3,
  },
  saturated: {
    borderWidth: 3,
  },
  text: {
    alignSelf: 'center',
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
  },
  textIconPadding: {
    width: 8,
  },
  gradientBackground: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 15,
  },
  solidBackground: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
  },
});

export default ThemeButton;
