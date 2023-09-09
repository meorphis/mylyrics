import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

type Props = {
  imageUrls: string[];
};

const CrystalBall = (props: Props) => {
  const {imageUrls} = props;

  const fadeAnim = useSharedValue(0);
  const rotateAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const crystalBallOpacityAnim = useSharedValue(1);

  useEffect(() => {
    fadeAnim.value = withRepeat(
      withSequence(
        withTiming(0.5, {
          duration: 2000 * (0.5 + Math.random()),
          easing: Easing.ease,
        }),
        withTiming(0.3, {
          duration: 2000 * (0.5 + Math.random()),
          easing: Easing.ease,
        }),
      ),
      -1,
      true,
    );

    rotateAnim.value = withRepeat(
      withTiming(360, {
        duration: 20000 * (0.5 + Math.random()),
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    scaleAnim.value = withRepeat(
      withSequence(
        withTiming(1.5, {
          duration: 2000 * (0.5 + Math.random()),
          easing: Easing.ease,
        }),
        withTiming(1, {
          duration: 2000 * (0.5 + Math.random()),
          easing: Easing.ease,
        }),
      ),
      -1,
      true,
    );

    crystalBallOpacityAnim.value = withRepeat(
      withSequence(
        withTiming(0.8, {
          duration: 2000 * (0.5 + Math.random()),
          easing: Easing.ease,
        }),
        withTiming(1, {
          duration: 2000 * (0.5 + Math.random()),
          easing: Easing.ease,
        }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedCrystalBallStyle = useAnimatedStyle(() => {
    return {
      opacity: crystalBallOpacityAnim.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.crystalBallContainer}>
        <Animated.View style={animatedCrystalBallStyle}>
          <Image
            source={require('../../../assets/crystal_ball.png')}
            style={styles.crystalBallImage}
          />
        </Animated.View>
      </View>
      {imageUrls.map((asset, index) => (
        <AlbumCover
          key={index}
          asset={asset}
          index={index}
          fadeAnim={fadeAnim}
          rotateAnim={rotateAnim}
          scaleAnim={scaleAnim}
        />
      ))}
    </View>
  );
};

type AlbumCoverProps = {
  asset: string;
  index: number;
  fadeAnim: SharedValue<number>;
  rotateAnim: SharedValue<number>;
  scaleAnim: SharedValue<number>;
};

const AlbumCover = (props: AlbumCoverProps) => {
  const {asset, index, fadeAnim, rotateAnim, scaleAnim} = props;

  const random = useRef(Math.random()).current;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: ((random + 1) / 2) * fadeAnim.value,
      top:
        25 +
        100 *
          random *
          Math.sin(
            (rotateAnim.value * Math.PI * (Math.floor(10 * random) - 5)) / 180 +
              index,
          ),
      left:
        25 +
        100 *
          random *
          Math.cos(
            (rotateAnim.value * Math.PI * (Math.floor(10 * random) - 5)) / 180 +
              index,
          ),
      transform: [
        {scale: Math.pow(scaleAnim.value, 2 * random)},
        {
          rotate: `${
            180 * random +
            ((rotateAnim.value * (Math.floor(10 * random) - 5)) % 360)
          }deg`,
        },
      ],
    };
  });

  return (
    <View key={index} style={styles.albumImageContainer}>
      <Animated.View style={animatedStyle}>
        <Image source={{uri: asset}} style={styles.albumImage} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  crystalBallContainer: {
    width: '100%',
    zIndex: 0,
    opacity: 0.8,
  },
  crystalBallImage: {
    maxWidth: '150%',
    objectFit: 'contain',
    alignSelf: 'center',
  },
  albumImageContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    top: '50%', // Center vertically in container
    left: '50%', // Center horizontally in container
    transform: [{translateX: -25}, {translateY: -100}], // Offset by half the width and height of the glisten to truly center it
    zIndex: 1,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
});

export default CrystalBall;
