import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import RecommendationsCarousel from '../Deck/DecksCarousel';
import AnimatedThemeBackground from '../common/AnimatedThemeBackground';
import BottomBar from '../BottomBar/BottomBar';
import ShareBottomSheet from '../ShareBottomSheet/ShareBottomSheet';

const Recommendations = () => {
  return (
    <View style={styles.container}>
      <AnimatedThemeBackground>
        <SafeAreaView style={styles.safearea}>
          <RecommendationsCarousel />
          <BottomBar />
        </SafeAreaView>
        <ShareBottomSheet />
      </AnimatedThemeBackground>
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
