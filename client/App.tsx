/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
// import {useSpotifyAuthentication} from './lib/spotify_auth';
import {DeviceIdProvider} from './lib/utility/device_id';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import {store} from './lib/utility/redux';
import {NavigationContainer} from '@react-navigation/native';
import {StackCardStyleInterpolator} from '@react-navigation/stack';
import FullLyrics from './lib/components/fullLyrics/FullLyricsScreen';
import MainScreen from './lib/components/main/MainScreen';
import {RootStackParamList} from './lib/types/navigation';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {
  SharedElementAnimation,
  SharedElementConfig,
  createSharedElementStackNavigator,
} from 'react-navigation-shared-element';
import PassageItemScreen from './lib/components/passageItem/PassageItemScreen';
import {SongType} from './lib/types/song';
import {cleanLyrics, splitLyricsWithPassages} from './lib/utility/lyrics';
import {CacheManager} from '@georstat/react-native-image-cache';
import {Dirs} from 'react-native-file-access';

const Stack = createSharedElementStackNavigator<RootStackParamList>();

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  blurRadius: 15,
  cacheLimit: 0,
  sourceAnimationDuration: 1000,
  thumbnailAnimationDuration: 1000,
};

function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={styles.gestureHandler}>
      <NavigationContainer>
        <Provider store={store}>
          <DeviceIdProvider>
            <SafeAreaProvider>
              <Stack.Navigator>
                <Stack.Screen
                  name="Main"
                  component={MainScreen}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="PassageItem"
                  component={PassageItemScreen}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="FullLyrics"
                  component={FullLyrics}
                  options={{
                    headerShown: false,
                  }}
                  sharedElements={(route, otherRoute, showing) => {
                    if (route.name !== 'FullLyrics' || !showing) {
                      return [];
                    }

                    const {
                      song,
                      sharedTransitionKey,
                      initiallyHighlightedPassageLyrics,
                    } = route.params as {
                      song: SongType;
                      sharedTransitionKey: string;
                      initiallyHighlightedPassageLyrics: string;
                    };

                    const splitLyrics = splitLyricsWithPassages({
                      songLyrics: cleanLyrics(song.lyrics),
                      passageLyrics: initiallyHighlightedPassageLyrics,
                    });

                    return [
                      ...(splitLyrics
                        .map(({passageLine}, index) => {
                          if (passageLine == null) {
                            return null;
                          }

                          return {
                            id: `${sharedTransitionKey}:lyrics:${index}`,
                            animation: 'fade-in' as SharedElementAnimation,
                          };
                        })
                        .filter(line => line != null) as SharedElementConfig[]),
                      {
                        id: `${sharedTransitionKey}:item_container`,
                        animation: 'fade-in' as SharedElementAnimation,
                      },
                    ];
                  }}
                />
              </Stack.Navigator>
            </SafeAreaProvider>
          </DeviceIdProvider>
        </Provider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const forFade: StackCardStyleInterpolator = ({current}) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

const styles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
  },
});

export default App;
