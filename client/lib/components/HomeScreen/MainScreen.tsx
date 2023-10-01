import {useGetUserRequest, useSetUserRequest} from '../../utility/db/user';
import React, {memo, useEffect, useState} from 'react';
import Recommendations from './Recommendations';
import SpotifyLogin from './SpotifyLogin';
import ErrorComponent from '../common/ErrorComponent';
import LoadingComponent from '../common/LoadingComponent';
import {useRecommendationsRequest} from '../../utility/db/recommendations';
import PendingRecommendations from './PendingRecommendations';
import {useNotifications} from '../../utility/helpers/notifications';
import {useSpotifyAuthentication} from '../../utility/helpers/spotify_auth';
import AppearingView from '../common/AppearingView';
import {StyleSheet} from 'react-native';
import {useRecentLikesRequest} from '../../utility/db/likes';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useActiveBundleKey} from '../../utility/redux/bundles/selectors';
import {useIsDeckFullyMeasured} from '../../utility/redux/measurement/selectors';

const MainScreen = () => {
  const {getUserRequest, makeGetUserRequest} = useGetUserRequest();
  const setUserRequest = useSetUserRequest();
  const {recommendationsRequest, makeRecommendationsRequest} =
    useRecommendationsRequest();
  const {request: recentLikesRequest, makeRequest: makeRecentLikesRequest} =
    useRecentLikesRequest();
  const {notificationStatus, expoPushToken} = useNotifications();
  const [spotifyAuthStatus, handleSpotifyLogin] = useSpotifyAuthentication();
  const activeBundleKey = useActiveBundleKey();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    makeRecommendationsRequest();
    makeRecentLikesRequest();
    makeGetUserRequest();
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

  // TODO: take another look at this
  return (
    <React.Fragment>
      {loading && renderLoading()}
      {activeBundleKey != null && (
        <MainScreenInner
          activeBundleKey={activeBundleKey}
          setLoading={setLoading}
        />
      )}
    </React.Fragment>
  );
};

const MainScreenInner = memo(
  (props: {
    activeBundleKey: string;
    setLoading: (loading: boolean) => void;
  }) => {
    const {activeBundleKey, setLoading} = props;
    const contentReady = useIsDeckFullyMeasured({bundleKey: activeBundleKey});

    console.log(`CONTENT READY: ${contentReady}`);

    const recommendationsOpacitySharedValue = useSharedValue(0);

    useEffect(() => {
      if (contentReady) {
        setLoading(false);
        recommendationsOpacitySharedValue.value = withTiming(1, {
          duration: 250,
        });
      }
    }, [contentReady]);

    const animatedRecommendations = useAnimatedStyle(() => {
      return {
        opacity: recommendationsOpacitySharedValue.value,
      };
    });

    return (
      <Animated.View style={[styles.recommendations, animatedRecommendations]}>
        <Recommendations />
      </Animated.View>
    );
  },
);

const renderLoading = () => {
  return (
    <AppearingView duration={500} style={styles.container}>
      <LoadingComponent size="large" />
    </AppearingView>
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
