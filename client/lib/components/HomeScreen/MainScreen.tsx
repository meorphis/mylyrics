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
import {StyleSheet, TouchableOpacity, Text} from 'react-native';
import {useRecentLikesRequest} from '../../utility/db/likes';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useActiveBundleKey} from '../../utility/redux/bundles/selectors';
import {textStyleCommon} from '../../utility/helpers/text';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useImpressionsUpdates} from '../../utility/db/impressions';
import {useIsDeckReadyForDisplay} from '../../utility/helpers/deck';
import {SetUserType} from '../../types/user';

const MainScreen = () => {
  const {getUserRequest, makeGetUserRequest} = useGetUserRequest();
  const setUserRequest = useSetUserRequest();
  const {
    recommendationsRequestStatus,
    makeRecommendationsRequest,
    applyPendingReload,
  } = useRecommendationsRequest();
  const {request: recentLikesRequest, makeRequest: makeRecentLikesRequest} =
    useRecentLikesRequest();
  const {notificationStatus, expoPushToken} = useNotifications();
  const [spotifyAuthStatus, handleSpotifyLogin] = useSpotifyAuthentication();
  const activeBundleKey = useActiveBundleKey();
  const [loading, setLoading] = useState(true);
  useImpressionsUpdates();

  useEffect(() => {
    makeRecommendationsRequest();
    makeRecentLikesRequest();
    makeGetUserRequest();
  }, []);

  useEffect(() => {
    let setUserData: SetUserType = {};

    if (getUserRequest.status === 'loaded') {
      if (expoPushToken && getUserRequest.data?.hasExpoPushToken !== true) {
        setUserData.expoPushToken = expoPushToken;
      }

      const timezoneOffset = new Date().getTimezoneOffset();
      if (getUserRequest.data.timezoneOffset !== timezoneOffset) {
        setUserData.timezoneOffset = timezoneOffset;
      }
    }

    if (Object.keys(setUserData).length > 0) {
      setUserRequest(setUserData);
    }
  }, [getUserRequest.status, expoPushToken]);

  if (recommendationsRequestStatus === 'error') {
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

  const dataIsLoading =
    recommendationsRequestStatus === 'loading' ||
    recommendationsRequestStatus === 'init' ||
    getUserRequest.status === 'loading' ||
    getUserRequest.status === 'init' ||
    recentLikesRequest.status === 'loading' ||
    recentLikesRequest.status === 'init' ||
    spotifyAuthStatus === 'pending';

  const showSpotifyLogin =
    !dataIsLoading &&
    !getUserRequest.data?.hasSpotifyAuth &&
    spotifyAuthStatus !== 'succeeded';

  if (showSpotifyLogin) {
    return <SpotifyLogin handleSpotifyLogin={handleSpotifyLogin} />;
  }

  const showPendingRecommendations =
    !dataIsLoading && recommendationsRequestStatus === 'loaded_with_no_data';

  if (showPendingRecommendations) {
    return <PendingRecommendations notificationStatus={notificationStatus} />;
  }

  // TODO: take another look at this
  return (
    <React.Fragment>
      {recommendationsRequestStatus === 'pending_reload' && (
        <PendingReload applyPendingReload={applyPendingReload} />
      )}
      {loading && renderLoading()}
      {activeBundleKey != null && (
        <MainScreenInner
          activeBundleKey={activeBundleKey}
          setLoading={setLoading}
          dataIsLoading={dataIsLoading}
        />
      )}
    </React.Fragment>
  );
};

const MainScreenInner = memo(
  (props: {
    activeBundleKey: string;
    setLoading: (loading: boolean) => void;
    dataIsLoading: boolean;
  }) => {
    const {activeBundleKey, setLoading, dataIsLoading} = props;
    const contentReady =
      useIsDeckReadyForDisplay({bundleKey: activeBundleKey}) && !dataIsLoading;

    const recommendationsOpacitySharedValue = useSharedValue(0);

    useEffect(() => {
      if (contentReady) {
        setLoading(false);
        recommendationsOpacitySharedValue.value = withTiming(1, {
          duration: 250,
        });
      } else {
        setLoading(true);
        recommendationsOpacitySharedValue.value = withTiming(0, {
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

const PendingReload = (props: {applyPendingReload: () => void}) => {
  const {applyPendingReload} = props;
  const insets = useSafeAreaInsets();

  return (
    <AppearingView
      duration={500}
      style={{...styles.pendingReloadContainer, top: insets.top + 12}}>
      <TouchableOpacity
        onPress={applyPendingReload}
        style={styles.pendingReloadButton}>
        <Text style={{...textStyleCommon, ...styles.pendingReloadText}}>
          load latest updates
        </Text>
      </TouchableOpacity>
    </AppearingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pendingReloadContainer: {
    zIndex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingReloadButton: {
    backgroundColor: '#d4af37',
    padding: 12,
    borderRadius: 24,
    borderColor: '#00000040',
    borderWidth: 3,
  },
  pendingReloadText: {
    fontSize: 16,
  },
  recommendations: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});

export default MainScreen;
