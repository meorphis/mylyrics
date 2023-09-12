import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import RecommendationsCarousel from './RecommendationsCarousel';
import {ThemeProvider} from '../../utility/theme';
import DefaultThemeBackground from '../common/DefaultThemeBackground';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import BottomBar from '../common/BottomBar';
import ShareBottomSheet from '../passageItem/ShareBottomSheet';
import {SharablePassageProvider} from '../../utility/shareable_passage';

const Recommendations = () => {
  const activeGroupKey = useSelector(
    (state: RootState) => state.activePassage?.groupKey,
  );

  return (
    <ThemeProvider>
      <SharablePassageProvider>
        <View style={styles.container}>
          <DefaultThemeBackground>
            <SafeAreaView style={styles.safearea}>
              <RecommendationsCarousel activeGroupKey={activeGroupKey} />
              <BottomBar activeGroupKey={activeGroupKey} />
            </SafeAreaView>
            <ShareBottomSheet />
          </DefaultThemeBackground>
        </View>
      </SharablePassageProvider>
    </ThemeProvider>
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
