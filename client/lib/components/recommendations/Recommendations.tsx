import React from 'react';
import {StyleSheet, View} from 'react-native';
// import {useSpotifyAuthentication} from './lib/spotify_auth';
import PassageGroupsCarousel from './PassageGroupsCarousel';
import {ThemeProvider} from '../../utility/theme';
import DefaultThemeBackground from './DefaultThemeBackground';

const Recommendations = () => {
  return (
    <ThemeProvider>
      <View style={styles.container}>
        <DefaultThemeBackground>
          <PassageGroupsCarousel />
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
});

export default Recommendations;
