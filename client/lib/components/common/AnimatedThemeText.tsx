/* eslint-disable no-bitwise */
import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import {Dimensions, StyleSheet, Text, TextProps, View} from 'react-native';
import {textStyleCommon} from '../../utility/helpers/text';
import {useThemeAnimationValues} from '../../utility/contexts/theme_animation';
import {interpolate, useDerivedValue} from 'react-native-reanimated';
import AnimatedLinearGradient from './AnimatedLinearGradient';
import {useActiveBundle} from '../../utility/redux/bundles/selectors';
import {useLyricCardSize} from '../../utility/helpers/lyric_card';
import { doesEmojiLookGoodAsASilhouette, getBundleEmoji } from '../../utility/helpers/sentiments';

const AnimatedThemeText = () => {
  return (
    <View style={styles.container}>
      <GradientText
        style={{
          ...textStyleCommon,
          ...styles.text,
        }}
      />
    </View>
  );
};

const GradientText = (props: Omit<TextProps, 'children'>) => {
  const {topCustomTextYOffset, bottomCustomTextYOffset} = useLyricCardSize();
  const bundle = useActiveBundle();

  let topText = '';
  let bottomText = '';
    
  if (bundle.info.type === 'user_made') {
    const {title, creator, recipient} = bundle.info;

    topText = title;
    const recipientText = recipient ? ` for ${recipient?.nickname}` : '';
    bottomText = `made by ${creator.nickname}` + recipientText;
  } else if (bundle.info.type === 'sentiment') {
    const {sentiment} = bundle.info;
    const emoji = getBundleEmoji(bundle.info);
    topText = `lyrics of ${sentiment}${emoji && doesEmojiLookGoodAsASilhouette(emoji) ? ' ' + emoji : ''}`
  } else if (bundle.info.type === 'artist') {
    const {artist} = bundle.info;
    const {name} = artist;
    topText = `lyrics by ${name}`
  } else {
    return null;
  }

  const topTextStyle = {
    ...textStyleCommon,
    ...styles.text,
    ...styles.topText,
    top: topCustomTextYOffset,
  };

  const bottomTextStyle = {
    ...textStyleCommon,
    ...styles.text,
    ...styles.bottomText,
    top: bottomCustomTextYOffset,
  };

  return (
    <MaskedView
      style={{}}
      maskElement={
        <React.Fragment>
          {topText && (
            <Text {...props} style={topTextStyle}>
              {topText}
            </Text>
          )}
          {bottomText && (
            <Text {...props} style={bottomTextStyle}>
              {bottomText}
            </Text>
          )}
        </React.Fragment>
      }>
      <AnimatedTextBackground>
        {topText && (
          <Text {...props} style={[topTextStyle, styles.hidden]}>
            {topText}
          </Text>
        )}
        {bottomText && (
          <Text {...props} style={[bottomTextStyle, styles.hidden]}>
            {bottomText}
          </Text>
        )}
      </AnimatedTextBackground>
    </MaskedView>
  );
};

type AnimatedTextBackgroundProps = {
  children: React.ReactNode;
};

export const AnimatedTextBackground = (props: AnimatedTextBackgroundProps) => {
  const {children} = props;

  const {interpolatedColors, interpolatedProgress} = useThemeAnimationValues();

  const reinterpolatedColors = useDerivedValue(() => {
    return interpolatedColors.value
      .map((c, idx) => {
        if (idx === interpolatedColors.value.length - 1) {
          return [computeContrastColor(c)];
        } else {
          return [
            computeContrastColor(c),
            computeWeightedContrastColor(
              c,
              interpolatedColors.value[idx + 1],
              0.66,
            ),
            computeWeightedContrastColor(
              c,
              interpolatedColors.value[idx + 1],
              0.33,
            ),
          ];
        }
      })
      .flat();
  });

  return (
    <AnimatedLinearGradient
      start={{x: 1.0, y: 0.0}}
      end={{x: 0.0, y: 1.0}}
      style={{
        height: Dimensions.get('window').height,
        width: Dimensions.get('window').width,
      }}
      interpolatedColors={reinterpolatedColors}
      interpolatedProgress={interpolatedProgress}
      throttleMs={100}>
      {children}
    </AnimatedLinearGradient>
  );
};

const computeContrastColor = (color: number) => {
  'worklet';
  // Extract ARGB components
  const a = (color & 0xff000000) >>> 24;
  const r = (color & 0x00ff0000) >>> 16;
  const g = (color & 0x0000ff00) >>> 8;
  const b = color & 0x000000ff;

  // Compute the Y component for the color
  const y = (r * 299 + g * 587 + b * 114) / 1000;

  const contrast = interpolate(y, [0, 147, 163, 255], [239, 221, 31, 15]);

  // Combine ARGB components back into a single 32-bit integer, keeping the original alpha
  const newColor =
    ((a << 24) | (contrast << 16) | (contrast << 8) | contrast) >>> 0;

  return newColor;
};

const computeWeightedContrastColor = (
  color1: number,
  color2: number,
  weight: number,
) => {
  'worklet';
  // Extract ARGB components for the first color
  const a1 = (color1 & 0xff000000) >>> 24;
  const r1 = (color1 & 0x00ff0000) >>> 16;
  const g1 = (color1 & 0x0000ff00) >>> 8;
  const b1 = color1 & 0x000000ff;

  // Extract ARGB components for the second color
  const a2 = (color2 & 0xff000000) >>> 24;
  const r2 = (color2 & 0x00ff0000) >>> 16;
  const g2 = (color2 & 0x0000ff00) >>> 8;
  const b2 = color2 & 0x000000ff;

  // Compute average components
  const avgA = a1 * weight + a2 * (1 - weight);
  const avgR = r1 * weight + r2 * (1 - weight);
  const avgG = g1 * weight + g2 * (1 - weight);
  const avgB = b1 * weight + b2 * (1 - weight);

  const averageColor = ((avgA << 24) | (avgR << 16) | (avgG << 8) | avgB) >>> 0;

  return computeContrastColor(averageColor);
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'flex-end',
    height: Dimensions.get('window').height,
  },
  text: {
    alignSelf: 'center',
  },
  topText: {
    fontWeight: 'bold',

    fontSize: 24,
  },
  bottomText: {
    fontSize: 18,
  },
  hidden: {
    opacity: 0,
  },
});

export default AnimatedThemeText;
