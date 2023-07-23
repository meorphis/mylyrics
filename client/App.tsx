/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
// import {useSpotifyAuthentication} from './lib/spotify_auth';
import {DeviceIdProvider} from './lib/utility/device_id';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import PassageGroupsCarousel from './lib/components/PassageGroupsCarousel';
import {ThemeProvider} from './lib/utility/theme';
import {Provider, useSelector} from 'react-redux';
import {RootState, store} from './lib/utility/redux';
import {useDispatch} from 'react-redux';
import {setActivePassage} from './lib/utility/redux/active_passage';
import {useRecommendationsRequest} from './lib/utility/db/recommendations';
import _ from 'lodash';
import ThemeBackground from './lib/components/ThemeBackground';

function App(): JSX.Element {
  return (
    <Provider store={store}>
      <DeviceIdProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <AppInner />
          </SafeAreaProvider>
        </ThemeProvider>
      </DeviceIdProvider>
    </Provider>
  );
}

// const passages: PassageType[] = [
//   {
//     lyrics:
//       "And after some time I know I would go blind\nBut seeing only binds the vision to the eye\nI'd lose my voice, I know\nBut I've nothing left to say\n(Nothing left to pray)\nNo echo in this space",
//     tags: [
//       {type: 'sentiment', sentiment: 'haunting'},
//       {type: 'sentiment', sentiment: 'desperate'},
//       {type: 'sentiment', sentiment: 'provocative'},
//     ],
//     song: {
//       name: 'adaphobia',
//       album: {
//         image:
//           'https://i.scdn.co/image/ab67616d0000b2735d02d7424dd0e0c8566b1e66',
//         name: 'Microcastle',
//       },
//       artist: {
//         names: ['Deerhunter'],
//       },
//     },
//   },
//   {
//     lyrics:
//       'Red souls, red friends\nInfinity guitars, go on\nInfinity guitars, go on',
//     tags: [
//       {type: 'sentiment', sentiment: 'rebellious'},
//       {type: 'sentiment', sentiment: 'chaotic'},
//       {type: 'sentiment', sentiment: 'energetic'},
//     ],
//     song: {
//       name: 'Infinity Guitars',
//       album: {
//         image:
//           'https://i.scdn.co/image/ab67616d0000b273e1d8ed663a5575b0d1f35b62',
//         name: 'Treats',
//       },
//       artist: {
//         names: ['Sleigh Bells'],
//       },
//     },
//   },
//   {
//     lyrics:
//       'No one on the corner has swagger like us\nHit me on my burner prepaid wireless\nWe pack and deliver like UPS trucks\nAlready going hard, just pumping that gas',
//     tags: [
//       {
//         type: 'sentiment',
//         sentiment: 'rebellious',
//       },
//       {
//         type: 'sentiment',
//         sentiment: 'energetic',
//       },
//       {
//         type: 'sentiment',
//         sentiment: 'provocative',
//       },
//     ],
//     song: {
//       name: 'Paper Planes',
//       album: {
//         image:
//           'https://i.scdn.co/image/ab67616d0000b273310d9098fbbde47bf7785637',
//         name: 'Kala',
//       },
//       artist: {
//         names: ['M.I.A.'],
//       },
//     },
//   },
// ];

// const passageGroups: PassageGroupsType = {
//   rebellious: {
//     tag: {
//       type: 'sentiment',
//       sentiment: 'rebellious',
//     },
//     passages: {
//       [passages[1].song.name]: passages[1],
//       [passages[2].song.name]: passages[2],
//     },
//   },
//   provocative: {
//     tag: {
//       type: 'sentiment',
//       sentiment: 'provocative',
//     },
//     passages: {
//       [passages[0].song.name]: passages[0],
//       [passages[2].song.name]: passages[2],
//     },
//   },
//   energetic: {
//     tag: {
//       type: 'sentiment',
//       sentiment: 'energetic',
//     },
//     passages: {
//       [passages[2].song.name]: passages[2],
//     },
//   },
// };

function AppInner(): JSX.Element {
  // const [_, handleSpotifyLogin] = useSpotifyAuthentication();

  const {recommendationsRequest, makeRecommendationsRequest} =
    useRecommendationsRequest();

  useEffect(() => {
    makeRecommendationsRequest();
  }, []);

  if (recommendationsRequest.status === 'loading') {
    return <ActivityIndicator />;
  }

  if (recommendationsRequest.status === 'error') {
    return (
      <View>
        <Text>{recommendationsRequest.error}</Text>
      </View>
    );
  }

  return <LoadedAppInner />;
}

function LoadedAppInner(): JSX.Element {
  const dispatch = useDispatch();

  const activePassage = useSelector((state: RootState) => {
    const r = state.recommendations;
    const activeGroupKey = Object.keys(r).find(
      groupKey => r[groupKey].status === 'loaded',
    );

    if (!activeGroupKey) {
      return null;
    }

    const activeGroup = r[activeGroupKey];

    if (activeGroup.status !== 'loaded') {
      throw new Error('this should not be possible');
    }

    const activePassageKey = Object.keys(activeGroup.data)[0];

    return {
      groupKey: activeGroupKey,
      passageKey: activePassageKey,
    };
  }, _.isEqual);

  useEffect(() => {
    if (activePassage) {
      dispatch(setActivePassage(activePassage));
    }
  }, [activePassage !== null]);

  if (!activePassage) {
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
      <ThemeBackground>
        <PassageGroupsCarousel />
      </ThemeBackground>
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

export default App;
