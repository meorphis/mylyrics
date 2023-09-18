import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import RecommendationsCarousel from './RecommendationsCarousel';
import DefaultThemeBackground from '../common/DefaultThemeBackground';
import BottomBar from '../common/BottomBar';
import ShareBottomSheet from '../passageItem/ShareBottomSheet/ShareBottomSheet';
import {useActiveGroupKey} from '../../utility/active_passage';

const Recommendations = () => {
  const activeGroupKey = useActiveGroupKey();

  return (
    <View style={styles.container}>
      <DefaultThemeBackground>
        <SafeAreaView style={styles.safearea}>
          <RecommendationsCarousel activeGroupKey={activeGroupKey} />
          <BottomBar activeGroupKey={activeGroupKey} />
        </SafeAreaView>
        <ShareBottomSheet />
      </DefaultThemeBackground>
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
