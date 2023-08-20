import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  SafeAreaView,
  LayoutChangeEvent,
} from 'react-native';
import React, {useCallback, useRef, useState} from 'react';
import {
  FullLyricsScreenProps,
  RootStackParamList,
} from '../../types/navigation';
import ThemeBackground from '../common/ThemeBackground';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import {textStyleCommon} from '../../utility/text';
import {cleanLyrics, splitLyricsWithPassages} from '../../utility/lyrics';
import ItemContainer from '../common/ItemContainer';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {isColorLight} from '../../utility/color';
import SelectionButton from './SelectionButton';
import AppearingView from '../common/AppearingView';
import LyricLines from './LyricLines';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import BackButton from './BackButton';
import {StackNavigationProp} from '@react-navigation/stack';

// shows the full lyrics for a song. a lot of the logic here is to ensure that
// the animation from the passage item to the full lyrics is smooth
const FullLyricsScreen = ({route}: FullLyricsScreenProps) => {
  const {
    song,
    theme,
    sharedTransitionKey,
    initiallyHighlightedPassageLyrics,
    parentYPosition,
  } = route.params;

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const songLyrics = cleanLyrics(song.lyrics);

  // *** y-axis positions ***
  // scroll view position
  const innerScrollViewPaddingTop = 24;
  const scrollView = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // scroll view boundaries
  const [scrollViewHeight, setScrollViewHeight] = React.useState<number | null>(
    null,
  );

  // lyrics position
  const [
    topOfInitiallyHighlightedLyricsPosition,
    setTopOfInitiallyHighlightedLyricsPosition,
  ] = React.useState<number | null>(null);

  // lyrics boundaries
  const [lyricsLayout, setLyricsLayout] = React.useState<{
    start: number;
    end: number;
  } | null>(null);

  // safe area
  const safeAreaHeight = useSafeAreaInsets().top;

  // we show a large amount of additional padding at the top and bottom of the
  // scroll view to begin with, to ensure that the highlighted lyrics are at
  // roughly the same position they were at in the PassageView - but after we've
  // scrolled these spacers out of view, we remove them so that the user cannot
  // scroll past the start/end of the lyrics
  const [showSpacer, setShowSpacer] = React.useState(true);
  const removeSpacers = () => {
    if (
      showSpacer &&
      topOfInitiallyHighlightedLyricsPosition != null &&
      lyricsLayout != null
    ) {
      setShowSpacer(false);
      scrollView.current?.scrollTo({
        y: scrollY.value - lyricsLayout.start,
        animated: false,
      });
    }
  };

  // we briefly hide the non-highlighted lyrics when the page first loads, to
  // make it easier to ensure that the highlighted lyrics show up in a specific
  // spot - but once the highlighted lyrics are in the right spot, we fade in
  // the rest of the lyrics
  const [showAppearingText, setShowAppearingText] = React.useState(false);

  // the highlighted lyrics will be at the top of their parent component
  // on first render, but once the appearing lyrics are rendered, they'll
  // get pushed down - at this point, we need to scroll accordingly
  useFocusEffect(
    useCallback(() => {
      if (
        topOfInitiallyHighlightedLyricsPosition != null &&
        lyricsLayout != null
      ) {
        const scrollTo =
          topOfInitiallyHighlightedLyricsPosition +
          safeAreaHeight -
          innerScrollViewPaddingTop -
          6;

        scrollView.current?.scrollTo({
          y: scrollTo,
          animated: false,
        });

        // scroll the spacers out of view - but wait a bit to ensure that the
        // the appearing text has faded in
        setTimeout(() => {
          if (scrollTo < lyricsLayout!.start) {
            // if the top spacer is in view (i.e. we've scrolled to a point above the
            // start of the actual content, scroll down with animation)
            scrollView.current?.scrollTo({
              y: lyricsLayout!.start,
            });
          } else if (scrollTo + scrollViewHeight! > lyricsLayout!.end) {
            // otherwise if the bottom spacer is in view, scroll up
            scrollView.current?.scrollTo({
              y: Math.max(
                lyricsLayout!.end - scrollViewHeight!,
                lyricsLayout!.start,
              ),
            });
          } else {
            // if we don't need to scroll, remove the spacers (otherwise, they'll
            // be removed by onMomentumScrollEnd)
            removeSpacers();
          }
        }, 500);
      }
    }, [
      topOfInitiallyHighlightedLyricsPosition != null && lyricsLayout != null,
    ]),
  );

  const {width, height} = Dimensions.get('window');

  const splitLyrics = splitLyricsWithPassages({
    songLyrics,
    passageLyrics: initiallyHighlightedPassageLyrics,
  });

  const initiallyHighlightedIndexes = splitLyrics.reduce(
    (indexes, {passageLine}, index) => {
      if (passageLine != null) {
        indexes.push(index);
      }
      return indexes;
    },
    [] as number[],
  );

  const [highlightedIndexes, setHighlightedIndexes] = useState<number[]>(
    initiallyHighlightedIndexes,
  );

  const [shouldHide, setShouldHide] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      setShouldHide(false);
      return () => {
        setTimeout(() => {
          setShouldHide(true);
          setShowAppearingText(false);
          setShowSpacer(true);
          setTopOfInitiallyHighlightedLyricsPosition(null);
          setLyricsLayout(null);
          scrollView.current?.scrollTo({
            y: 0,
            animated: false,
          });
        }, 500);
      };
    }, []),
  );

  if (shouldHide) {
    return null;
  }

  return (
    <ThemeBackground theme={theme}>
      <SafeAreaView>
        <View
          style={{
            ...styles.container,
            width: width * 0.95,
            height: (height - safeAreaHeight) * 0.95,
          }}>
          <ItemContainer theme={theme}>
            <Animated.ScrollView
              ref={scrollView}
              style={styles.scrollView}
              onLayout={(event: LayoutChangeEvent) => {
                setScrollViewHeight(event.nativeEvent.layout.height);
              }}
              scrollEventThrottle={16}
              onScroll={onScroll}
              onMomentumScrollEnd={removeSpacers}>
              {showSpacer && <View style={{height: parentYPosition}} />}
              <View
                style={{
                  ...styles.innerScrollView,
                  paddingTop: innerScrollViewPaddingTop,
                }}
                onLayout={event => {
                  if (showAppearingText) {
                    setLyricsLayout({
                      start: event.nativeEvent.layout.y,
                      end:
                        event.nativeEvent.layout.y +
                        event.nativeEvent.layout.height,
                    });
                  }
                }}>
                {showAppearingText && (
                  <AppearingView
                    delay={50}
                    duration={750}
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      ...styles.metadataColumn,
                      borderBottomColor: isColorLight(theme.backgroundColor)
                        ? 'rgba(0, 0, 0, 0.5)'
                        : 'rgba(255, 255, 255, 0.5)',
                    }}>
                    <Text
                      style={{
                        ...textStyleCommon,
                        ...styles.songNameText,
                        color: theme.primaryColor,
                      }}>
                      {song.name}
                    </Text>
                    <Text
                      style={{
                        ...textStyleCommon,
                        ...styles.artistNameText,
                        color: theme.secondaryColor,
                      }}>
                      {song.artists.map(artist => artist.name).join(', ')}
                    </Text>
                    <Text
                      style={{
                        ...textStyleCommon,
                        ...styles.albumNameText,
                        color: theme.detailColor,
                      }}>
                      {song.album.name}
                    </Text>
                  </AppearingView>
                )}
                <LyricLines
                  splitLyrics={splitLyrics}
                  highlightedIndexes={highlightedIndexes}
                  setHighlightedIndexes={setHighlightedIndexes}
                  onLayoutInitiallyHighlightedLyrics={yPosition => {
                    if (showAppearingText) {
                      setTopOfInitiallyHighlightedLyricsPosition(yPosition);
                    } else {
                      // very brief delay to ensure the page is entirely laid out before
                      // we show the appearing text
                      setTimeout(() => setShowAppearingText(true), 100);
                    }
                  }}
                  theme={theme}
                  sharedTransitionKey={sharedTransitionKey}
                  shouldShowAppearingText={showAppearingText}
                />
              </View>
              {showSpacer && <View style={{height}} />}
            </Animated.ScrollView>
            <View style={styles.buttonContainer}>
              <BackButton theme={theme} onPress={() => navigation.goBack()} />
              <SelectionButton
                highlightedIndexes={highlightedIndexes}
                theme={theme}
                onPress={() => {
                  navigation.replace('PassageItem', {
                    passage: {
                      lyrics: highlightedIndexes
                        .map(index => splitLyrics[index].lineText)
                        .join('\n'),
                      tags: [],
                      song: song,
                    },
                    theme,
                  });
                }}
              />
            </View>
          </ItemContainer>
        </View>
      </SafeAreaView>
    </ThemeBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  scrollView: {
    flexDirection: 'column',
  },
  innerScrollView: {
    paddingHorizontal: 24,
  },
  metadataColumn: {
    flexDirection: 'column',
    paddingBottom: 24,
    marginBottom: 16,
    marginTop: 16,
    marginHorizontal: 8,
    paddingHorizontal: 0,
    flex: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  songNameText: {
    fontSize: 24,
  },
  artistNameText: {
    fontSize: 18,
  },
  albumNameText: {
    fontSize: 18,
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
  },
});

export default FullLyricsScreen;
