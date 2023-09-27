import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import DecksCarousel from '../Deck/DecksCarousel';
import AnimatedThemeBackground from '../common/AnimatedThemeBackground';
import BottomBar from '../BottomBar/BottomBar';
import ShareBottomSheet from '../ShareBottomSheet/ShareBottomSheet';
import {ThemeAnimationProvider} from '../../utility/contexts/theme_animation';

const Recommendations = () => {
  return (
    <View style={styles.container}>
      <ThemeAnimationProvider>
        <AnimatedThemeBackground>
          <SafeAreaView style={styles.safearea}>
            <DecksCarousel />
            <BottomBar />
          </SafeAreaView>
          <ShareBottomSheet />
        </AnimatedThemeBackground>
      </ThemeAnimationProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safearea: {
    flex: 1,
  },
});

export default Recommendations;
