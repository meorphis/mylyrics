import React, {useRef} from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import PassageGroupsCarousel from './PassageGroupsCarousel';
import {ThemeProvider} from '../../utility/theme';
import DefaultThemeBackground from './DefaultThemeBackground';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import BottomBar from '../common/BottomBar';

const Recommendations = () => {
  const activeGroupKey = useSelector(
    (state: RootState) => state.activePassage?.groupKey,
  );

  const containerRef = useRef<View>(null);

  return (
    <ThemeProvider>
      <View style={styles.container}>
        <DefaultThemeBackground>
          <SafeAreaView style={styles.safearea} ref={containerRef}>
            <PassageGroupsCarousel activeGroupKey={activeGroupKey} />
            <BottomBar activeGroupKey={activeGroupKey} />
          </SafeAreaView>
        </DefaultThemeBackground>
      </View>
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
