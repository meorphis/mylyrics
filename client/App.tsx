/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
// import {useSpotifyAuthentication} from './lib/spotify_auth';
import {DeviceIdProvider} from './lib/utility/contexts/device_id';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as ReduxProvider} from 'react-redux';
import {store} from './lib/utility/redux';
import {NavigationContainer} from '@react-navigation/native';
import FullLyrics from './lib/components/FullLyricsScreen/FullLyricsScreen';
import MainScreen from './lib/components/HomeScreen/MainScreen';
import {RootStackParamList} from './lib/types/navigation';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {CacheManager} from '@georstat/react-native-image-cache';
import {Dirs} from 'react-native-file-access';
import {useBundleLink} from './lib/utility/helpers/bundle_links';
import {ThemeProgressProvider} from './lib/utility/contexts/theme_animation';

const Stack = createNativeStackNavigator<RootStackParamList>();

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  blurRadius: 15,
  cacheLimit: 0,
  sourceAnimationDuration: 1000,
  thumbnailAnimationDuration: 1000,
};

function App(): JSX.Element {
  return (
    <ReduxProvider store={store}>
      <GestureHandlerRootView style={styles.gestureHandler}>
        <NavigationContainer>
          <DeviceIdProvider>
            <ThemeProgressProvider>
              <SafeAreaProvider>
                <AppInner />
              </SafeAreaProvider>
            </ThemeProgressProvider>
          </DeviceIdProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ReduxProvider>
  );
}

const AppInner = () => {
  useBundleLink();

  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'fade',
      }}>
      <Stack.Screen
        name="Main"
        component={MainScreen}
        options={{
          headerShown: false,
          // cardStyleInterpolator: forFade,
        }}
      />
      <Stack.Screen
        name="FullLyrics"
        component={FullLyrics}
        options={{
          headerShown: false,
          // cardStyleInterpolator: forFade,
        }}
        // sharedElements={(route, _, showing) => {
        //   if (route.name !== 'FullLyrics' || !showing) {
        //     return [];
        //   }
        //   const {
        //     originalPassage,
        //     sharedTransitionKey,
        //     initiallyHighlightedPassageLyrics,
        //   } = route.params as {
        //     originalPassage: PassageType;
        //     sharedTransitionKey: string;
        //     initiallyHighlightedPassageLyrics: string;
        //   };

        //   const splitLyrics = splitLyricsWithPassages({
        //     songLyrics: cleanLyrics(
        //       originalPassage.song.lyrics,
        //     ),
        //     passageLyrics: initiallyHighlightedPassageLyrics,
        //   });

        //   return [
        //     ...(splitLyrics
        //       .map(({passageLine}, index) => {
        //         if (passageLine == null) {
        //           return null;
        //         }

        //         return {
        //           id: `${sharedTransitionKey}:lyrics:${index}`,
        //           animation: 'fade' as SharedElementAnimation,
        //         };
        //       })
        //       .filter(
        //         line => line != null,
        //       ) as SharedElementConfig[]),
        //     {
        //       id: `${sharedTransitionKey}:buttons`,
        //       animation: 'fade' as SharedElementAnimation,
        //     },
        //   ];
        // }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
  },
});

export default App;
