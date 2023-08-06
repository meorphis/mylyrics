import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
// import {useSpotifyAuthentication} from './lib/spotify_auth';
import PassageGroupsCarousel from './PassageGroupsCarousel';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import {useRecommendationsRequest} from '../../utility/db/recommendations';
import {ThemeProvider} from '../../utility/theme';
import DefaultThemeBackground from './DefaultThemeBackground';

const RecommendationsScreen = () => {
  // const [_, handleSpotifyLogin] = useSpotifyAuthentication();

  const {recommendationsRequest, makeRecommendationsRequest} =
    useRecommendationsRequest();

  useEffect(() => {
    makeRecommendationsRequest();
  }, []);

  if (
    recommendationsRequest.status === 'loading' ||
    recommendationsRequest.status === 'init'
  ) {
    return <ActivityIndicator />;
  }

  if (recommendationsRequest.status === 'error') {
    return (
      <View>
        <Text>{recommendationsRequest.error}</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <LoadedAppInner />
    </ThemeProvider>
  );
};

function LoadedAppInner(): JSX.Element {
  const activePassageIsSet = useSelector(
    (state: RootState) => state.activePassage != null,
  );

  if (!activePassageIsSet) {
    return (
      <View>
        <Text>No recommendations</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <Button
          title="Connect with Spotify"
          onPress={() => handleSpotifyLogin({deviceId})}
        /> */}
      <DefaultThemeBackground>
        <PassageGroupsCarousel />
      </DefaultThemeBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecommendationsScreen;
