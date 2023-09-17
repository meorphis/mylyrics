import {useGetUserRequest, useSetUserRequest} from '../../utility/db/user';
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
import {useRecentLikesRequest} from '../../utility/db/likes';
import {useFontSize} from '../../utility/font_size';

const MainScreen = () => {
  const {allComputed: allFontSizesComputed} = useFontSize();
  const {getUserRequest, makeGetUserRequest} = useGetUserRequest();
  const setUserRequest = useSetUserRequest();
  const {recommendationsRequest, makeRecommendationsRequest} =
    useRecommendationsRequest();
  const {request: recentLikesRequest, makeRequest: makeRecentLikesRequest} =
    useRecentLikesRequest();
  const {notificationStatus, expoPushToken} = useNotifications();
  const [spotifyAuthStatus, handleSpotifyLogin] = useSpotifyAuthentication();

  useEffect(() => {
    makeRecommendationsRequest();
    makeGetUserRequest();
    makeRecentLikesRequest();
  }, []);

  useEffect(() => {
    if (
      getUserRequest.status === 'loaded' &&
      expoPushToken &&
      getUserRequest.data?.hasExpoPushToken !== true
    ) {
      setUserRequest({expoPushToken});
    }
  }, [getUserRequest.status, expoPushToken]);

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
    getUserRequest.status === 'error' ||
    recentLikesRequest.status === 'error'
  ) {
    return <ErrorComponent />;
  }

  if (
    !allFontSizesComputed ||
    recommendationsRequest.status === 'loading' ||
    recommendationsRequest.status === 'init' ||
    getUserRequest.status === 'loading' ||
    getUserRequest.status === 'init' ||
    recentLikesRequest.status === 'loading' ||
    recentLikesRequest.status === 'init' ||
    spotifyAuthStatus === 'pending'
  ) {
    return (
      <AppearingView duration={500} style={styles.container}>
        <LoadingComponent size="large" />
      </AppearingView>
    );
  }

  if (
    !getUserRequest.data?.hasSpotifyAuth &&
    spotifyAuthStatus !== 'succeeded'
  ) {
    return <SpotifyLogin handleSpotifyLogin={handleSpotifyLogin} />;
  }

  if (recommendationsRequest.data == null) {
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
