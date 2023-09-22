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
import {RootState} from '../../utility/redux';
import {getPassageId} from '../../utility/passage_id';
import {useSelector} from 'react-redux';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const MainScreen = () => {
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

  if (recommendationsRequest.status === 'error') {
    console.log(recommendationsRequest.error);
    return <ErrorComponent />;
  }

  if (getUserRequest.status === 'error') {
    console.log(getUserRequest.error);
    return <ErrorComponent />;
  }

  if (recentLikesRequest.status === 'error') {
    console.log(recentLikesRequest.error);
    return <ErrorComponent />;
  }

  const showOnlyLoader =
    recommendationsRequest.status === 'loading' ||
    recommendationsRequest.status === 'init' ||
    getUserRequest.status === 'loading' ||
    getUserRequest.status === 'init' ||
    recentLikesRequest.status === 'loading' ||
    recentLikesRequest.status === 'init' ||
    spotifyAuthStatus === 'pending';

  const showSpotifyLogin =
    !showOnlyLoader &&
    !getUserRequest.data?.hasSpotifyAuth &&
    spotifyAuthStatus !== 'succeeded';

  if (showSpotifyLogin) {
    return <SpotifyLogin handleSpotifyLogin={handleSpotifyLogin} />;
  }

  const showPendingRecommendations =
    !showOnlyLoader && recommendationsRequest.data == null;

  if (showPendingRecommendations) {
    return <PendingRecommendations notificationStatus={notificationStatus} />;
  }

  return <MainScreenInner showOnlyLoader={showOnlyLoader} />;
};

const MainScreenInner = (props: {showOnlyLoader: boolean}) => {
  const {showOnlyLoader} = props;

  const contentReady = useSelector((state: RootState) => {
    const passageIds = Object.values(state.recommendations)
      .map(r => Object.values(r.passageGroupRequest.data))
      .flat()
      .map(p => getPassageId(p.passage));

    if (passageIds.length === 0) {
      return false;
    }

    const contentReadyState = new Set(state.contentReady);

    const diff = passageIds.filter(p => !contentReadyState.has(p));

    return diff.length === 0;
  });

  const recommendationsOpacitySharedValue = useSharedValue(0);

  useEffect(() => {
    if (contentReady) {
      console.log('CONTENT READY ALL');
      recommendationsOpacitySharedValue.value = withTiming(1, {duration: 500});
    }
  }, [contentReady]);

  const animatedRecommendations = useAnimatedStyle(() => {
    return {
      opacity: recommendationsOpacitySharedValue.value,
    };
  });

  return (
    <React.Fragment>
      {(showOnlyLoader || !contentReady) && (
        <AppearingView duration={500} style={styles.container}>
          <LoadingComponent size="large" />
        </AppearingView>
      )}
      {!showOnlyLoader && (
        <Animated.View
          style={[styles.recommendations, animatedRecommendations]}>
          <Recommendations />
        </Animated.View>
      )}
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  recommendations: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});

export default MainScreen;
