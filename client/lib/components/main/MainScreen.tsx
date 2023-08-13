import {useUserRequest} from '../../utility/db/user';
import React, {useEffect, useRef, useState} from 'react';
import Recommendations from '../recommendations/Recommendations';
import SpotifyLogin from '../nux/SpotifyLogin';
import ErrorComponent from '../common/ErrorComponent';
import LoadingComponent from '../common/LoadingComponent';
import {useRecommendationsRequest} from '../../utility/db/recommendations';
import PendingRecommendations from '../nux/PendingRecommendations';
import {useNotifications} from '../../utility/notifications';
import {useSpotifyAuthentication} from '../../utility/spotify_auth';
import AppearingView from '../common/AppearingView';
import {AppState, StyleSheet} from 'react-native';

const MainScreen = () => {
  const {userRequest, makeUserRequest} = useUserRequest();
  const {recommendationsRequest, makeRecommendationsRequest} =
    useRecommendationsRequest();
  const notificationStatus = useNotifications();
  const [spotifyAuthStatus, handleSpotifyLogin] = useSpotifyAuthentication();

  useEffect(() => {
    makeRecommendationsRequest();
    makeUserRequest();
  }, []);

  const appState = useRef(AppState.currentState);
  const [_, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (
    recommendationsRequest.status === 'error' ||
    userRequest.status === 'error'
  ) {
    return <ErrorComponent />;
  }

  if (
    recommendationsRequest.status === 'loading' ||
    recommendationsRequest.status === 'init' ||
    userRequest.status === 'loading' ||
    userRequest.status === 'init' ||
    spotifyAuthStatus === 'pending'
  ) {
    return (
      <AppearingView delay={0} duration={500} style={styles.container}>
        <LoadingComponent size="large" />
      </AppearingView>
    );
  }

  console.log(spotifyAuthStatus);

  if (!userRequest.data?.hasSpotifyAuth && spotifyAuthStatus !== 'succeeded') {
    return <SpotifyLogin handleSpotifyLogin={handleSpotifyLogin} />;
  }

  if (recommendationsRequest.data === false) {
    return <PendingRecommendations notificationStatus={notificationStatus} />;
  }

  return <Recommendations />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MainScreen;
