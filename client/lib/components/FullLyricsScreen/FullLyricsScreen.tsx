import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import React, {memo, useEffect, useState} from 'react';
import {
  FullLyricsScreenProps,
  RootStackParamList,
} from '../../types/navigation';
import AnimatedThemeBackground from '../common/AnimatedThemeBackground';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {textStyleCommon} from '../../utility/helpers/text';
import ItemContainer, {
  ITEM_CONTAINER_BORDER_RADIUS,
  ITEM_CONTAINER_BORDER_WIDTH,
} from '../common/ItemContainer';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {isColorLight} from '../../utility/helpers/color';
import SelectionButton from './SelectionButton';
import AppearingView from '../common/AppearingView';
import LyricLines from './LyricLines';
import {useNavigation} from '@react-navigation/native';
import BackButton from './BackButton';
import {StackNavigationProp} from '@react-navigation/stack';
import {SongType} from '../../types/song';
import ThemeType from '../../types/theme';
import _ from 'lodash';
import {splitLyricsWithPassages} from '../../utility/helpers/lyrics';
import {useLyricsYPosition} from '../../utility/redux/measurement/selectors';
import {useDispatch} from 'react-redux';
import {setLyrics} from '../../utility/redux/shareable_passage/slice';
import {setActiveBundlePassage} from '../../utility/redux/bundles/slice';
import {getPassageId} from '../../utility/helpers/passage';
import {ThemeAnimationProvider} from '../../utility/contexts/theme_animation';

const CONTAINER_PADDING = 12;

// shows the full lyrics for a song; a lot of the logic here is to ensure that
// the animation from the passage item to the full lyrics is smooth
const FullLyricsScreen = ({route}: FullLyricsScreenProps) => {
  console.log(
    `rendering FullLyricsScreen ${route.params.customizablePassage.passage.song.name}`,
  );

  const {
    customizablePassage,
    lyricCardMeasurementContext,
    lyricsYPositionOffset,
    sharedTransitionKey,
    onSelect,
  } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const {
    passage,
    customization: {themeSelection},
  } = customizablePassage;

  const {song} = passage;
  const theme = themeSelection.inverted
    ? themeSelection.theme.invertedTheme!
    : themeSelection.theme;

  const dispatch = useDispatch();

  // *** y-axis positions ***
  const parentYPosition =
    lyricsYPositionOffset +
    (useLyricsYPosition({
      globalPassageKey: passage.passageKey,
      context: lyricCardMeasurementContext,
    }) ?? 0);

  console.log(lyricsYPositionOffset, parentYPosition);

  // scroll view position
  const innerScrollViewPaddingTop = 24;

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
  const [
    innerScrollViewLayoutAfterAppearingTextIsRendered,
    setInnerScrollViewLayoutAfterAppearingTextIsRendered,
  ] = React.useState<{
    start: number;
    end: number;
  } | null>(null);

  // we show a large amount of additional padding at the top and bottom of the
  // scroll view to begin with, to ensure that the highlighted lyrics are at
  // roughly the same position they were at in the PassageView - but after we've
  // scrolled these spacers out of view, we remove them so that the user cannot
  // scroll past the start/end of the lyrics
  const [showSpacer, setShowSpacer] = React.useState(true);

  const safeAreaInsets = useSafeAreaInsets();

  const [scrollViewOffset, setScrollViewOffset] = React.useState<{
    initial: number;
    scrollTo: number | null;
  } | null>(null);

  // the highlighted lyrics will be at the top of their parent component
  // on first render, but once the appearing lyrics are rendered, they'll
  // get pushed down - at this point, we need to scroll accordingly
  useEffect(() => {
    setTimeout(() => {
      if (
        topOfInitiallyHighlightedLyricsPosition != null &&
        innerScrollViewLayoutAfterAppearingTextIsRendered != null
      ) {
        // topOfInitiallyHighlightedLyricsPosition (controlling for padding) is
        // the extent to which adding the appearing lyrics pushes the highlighted lyrics down,
        // so we need to scroll by that amount to avoid a visible jump
        const scrollTo =
          topOfInitiallyHighlightedLyricsPosition - innerScrollViewPaddingTop;

        // in this case the top spacer is in view; we will first do a non-animated scroll to
        // account for the appearing lyrics, then an animated scroll to scroll the spacer out
        // of view (the onMomentumScrollEnd handler will remove the spacers)
        if (
          scrollTo < innerScrollViewLayoutAfterAppearingTextIsRendered!.start
        ) {
          setScrollViewOffset({
            initial: scrollTo,
            scrollTo: innerScrollViewLayoutAfterAppearingTextIsRendered!.start,
          });
        }
        // very similar to the above case - in this case the bottom spacer is in view, so we
        // will first do a non-animated scroll to account for the appearing lyrics, then an
        // animated scroll to scroll the spacer out of view
        else if (
          scrollTo + scrollViewHeight! >
          innerScrollViewLayoutAfterAppearingTextIsRendered!.end
        ) {
          setScrollViewOffset({
            initial: scrollTo,
            scrollTo: Math.max(
              innerScrollViewLayoutAfterAppearingTextIsRendered!.end -
                scrollViewHeight!,
              innerScrollViewLayoutAfterAppearingTextIsRendered!.start,
            ),
          });
        } else {
          // in this case the spacers are not in view, so we can just do a non-animated scroll
          // to account for both the appearing lyrics and the spacers and manually remove the
          // spacers synchronously
          setScrollViewOffset({
            initial:
              scrollTo -
              innerScrollViewLayoutAfterAppearingTextIsRendered.start,
            scrollTo: null,
          });
          setShowSpacer(false);
        }
      }
    }, 100);
  }, [
    topOfInitiallyHighlightedLyricsPosition != null &&
      innerScrollViewLayoutAfterAppearingTextIsRendered != null &&
      scrollViewHeight != null,
  ]);

  const splitLyrics = splitLyricsWithPassages({
    passageLyrics: passage.lyrics,
    songLyrics: song.lyrics,
  });

  const initiallyHighlightedIndexes = splitLyrics.reduce(
    (indexes, {passageInfo}, index) => {
      if (passageInfo != null) {
        indexes.push(index);
      }
      return indexes;
    },
    [] as number[],
  );

  const [highlightedIndexes, setHighlightedIndexes] = useState<number[]>(
    initiallyHighlightedIndexes,
  );

  const topSpacerHeight =
    parentYPosition -
    CONTAINER_PADDING -
    innerScrollViewPaddingTop -
    ITEM_CONTAINER_BORDER_WIDTH;

  return (
    <ThemeAnimationProvider>
      <AnimatedThemeBackground>
        <View
          style={{
            ...styles.container,
            // for some reason SafeAreaView doesn't play well with the animation
            // so we create the padding manually
            paddingTop: CONTAINER_PADDING + safeAreaInsets.top,
            paddingBottom: CONTAINER_PADDING + safeAreaInsets.bottom,
          }}>
          <ItemContainer theme={theme}>
            {scrollViewOffset == null ? (
              <React.Fragment>
                <SwapableScrollView
                  key="initial"
                  isInitialVersion={true}
                  innerScrollViewPaddingTop={innerScrollViewPaddingTop}
                  showSpacer={true}
                  topSpacerHeight={topSpacerHeight}
                  song={song}
                  splitLyrics={splitLyrics}
                  highlightedIndexes={highlightedIndexes}
                  setHighlightedIndexes={setHighlightedIndexes}
                  theme={theme}
                  sharedTransitionKey={sharedTransitionKey}
                  isTemporaryView
                />
                <View style={styles.invisibleScrollView}>
                  <SwapableScrollView
                    key="hidden"
                    isInitialVersion={false}
                    onInnerViewLayout={
                      setInnerScrollViewLayoutAfterAppearingTextIsRendered
                    }
                    onLayoutInitiallyHighlightedLyrics={
                      setTopOfInitiallyHighlightedLyricsPosition
                    }
                    innerScrollViewPaddingTop={innerScrollViewPaddingTop}
                    showSpacer={showSpacer}
                    topSpacerHeight={topSpacerHeight}
                    song={song}
                    splitLyrics={splitLyrics}
                    highlightedIndexes={highlightedIndexes}
                    setHighlightedIndexes={setHighlightedIndexes}
                    theme={theme}
                    isTemporaryView
                    skipAnimation={true}
                  />
                </View>
              </React.Fragment>
            ) : showSpacer ? (
              <SwapableScrollView
                key="intermediate"
                isInitialVersion={false}
                verticalOffset={scrollViewOffset.initial}
                scrollTo={scrollViewOffset.scrollTo ?? undefined}
                onMomentumScrollEnd={() => setShowSpacer(false)}
                innerScrollViewPaddingTop={innerScrollViewPaddingTop}
                showSpacer={showSpacer}
                topSpacerHeight={topSpacerHeight}
                song={song}
                splitLyrics={splitLyrics}
                highlightedIndexes={highlightedIndexes}
                setHighlightedIndexes={setHighlightedIndexes}
                theme={theme}
                isTemporaryView
              />
            ) : (
              <SwapableScrollView
                key="final"
                isInitialVersion={false}
                skipAnimation={scrollViewOffset.scrollTo != null}
                verticalOffset={
                  scrollViewOffset.scrollTo != null
                    ? scrollViewOffset.scrollTo - topSpacerHeight
                    : scrollViewOffset.initial
                }
                innerScrollViewPaddingTop={innerScrollViewPaddingTop}
                showSpacer={showSpacer}
                topSpacerHeight={topSpacerHeight}
                song={song}
                splitLyrics={splitLyrics}
                highlightedIndexes={highlightedIndexes}
                setHighlightedIndexes={setHighlightedIndexes}
                theme={theme}
              />
            )}

            <View
              onLayout={event => {
                setScrollViewHeight(event.nativeEvent.layout.y);
              }}
              style={{
                ...styles.buttonContainer,
                backgroundColor: theme.backgroundColor,
              }}>
              <BackButton
                style={styles.button}
                onPress={() => navigation.goBack()}
              />
              <SelectionButton
                highlightedIndexes={highlightedIndexes}
                style={{...styles.button, ...styles.selectionButton}}
                onPress={() => {
                  const selectedLyrics = highlightedIndexes
                    .map(index => splitLyrics[index].lineText)
                    .join('\n');

                  switch (onSelect) {
                    case 'ADD_SINGLETON_PASSAGE':
                      const newPassage = {
                        ...passage,
                        lyrics: selectedLyrics,
                        bundleKey: 'singleton',
                        sortKey: 0,
                      };

                      dispatch(
                        setActiveBundlePassage({
                          ...newPassage,
                          passageKey: getPassageId(newPassage),
                        }),
                      );
                      navigation.goBack();
                      break;
                    case 'UPDATE_SHAREABLE':
                      dispatch(setLyrics(selectedLyrics));
                      navigation.goBack();
                      break;
                  }
                }}
              />
            </View>
          </ItemContainer>
        </View>
      </AnimatedThemeBackground>
    </ThemeAnimationProvider>
  );
};

type SwapableScrollViewProps = {
  isInitialVersion: boolean;
  verticalOffset?: number;
  scrollTo?: number;
  skipAnimation?: boolean;
  onScroll?: (event: any) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onInnerViewLayout?: ({start, end}: {start: number; end: number}) => void;
  onLayoutInitiallyHighlightedLyrics?: (y: number) => void;
  onMomentumScrollEnd?: () => void;
  innerScrollViewPaddingTop: number;
  showSpacer: boolean;
  topSpacerHeight: number;
  song: SongType;
  splitLyrics: {
    lineText: string;
    passageInfo: {
      passageStart: number;
      passageEnd: number;
      passageLine: number;
    } | null;
  }[];
  highlightedIndexes: number[];
  setHighlightedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
  theme: ThemeType;
  sharedTransitionKey?: string;
  isTemporaryView?: boolean;
};

const SwapableScrollView = memo(
  (props: SwapableScrollViewProps) => {
    const {
      isInitialVersion,
      verticalOffset,
      scrollTo,
      skipAnimation,
      onScroll,
      onLayout,
      onInnerViewLayout,
      onLayoutInitiallyHighlightedLyrics,
      onMomentumScrollEnd,
      innerScrollViewPaddingTop,
      showSpacer,
      topSpacerHeight,
      song,
      splitLyrics,
      highlightedIndexes,
      setHighlightedIndexes,
      theme,
      sharedTransitionKey,
      isTemporaryView,
    } = props;
    const ref = React.useRef<Animated.ScrollView>(null);

    const {height} = Dimensions.get('window');

    const inner = (
      <React.Fragment>
        {showSpacer && <View style={{height: topSpacerHeight}} />}
        <View
          style={{
            ...styles.innerScrollView,
            paddingTop: innerScrollViewPaddingTop,
          }}
          onLayout={event => {
            if (onInnerViewLayout) {
              onInnerViewLayout({
                start: event.nativeEvent.layout.y,
                end:
                  event.nativeEvent.layout.y + event.nativeEvent.layout.height,
              });
            }
          }}>
          {isInitialVersion ? null : (
            <AppearingView
              duration={500}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                ...styles.metadataColumn,
                borderBottomColor: isColorLight(theme.backgroundColor)
                  ? 'rgba(0, 0, 0, 0.5)'
                  : 'rgba(255, 255, 255, 0.5)',
              }}
              skipAnimation={skipAnimation}>
              <Text
                style={{
                  ...textStyleCommon,
                  ...styles.songNameText,
                  color: theme.textColors[0],
                }}>
                {song.name}
              </Text>
              <Text
                style={{
                  ...textStyleCommon,
                  ...styles.artistNameText,
                  color: theme.textColors[0],
                }}>
                {song.artists.map(artist => artist.name).join(', ')}
              </Text>
              <Text
                style={{
                  ...textStyleCommon,
                  ...styles.albumNameText,
                  color: theme.textColors[0],
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
              if (onLayoutInitiallyHighlightedLyrics) {
                onLayoutInitiallyHighlightedLyrics(yPosition);
              }
            }}
            theme={theme}
            sharedTransitionKey={sharedTransitionKey}
            shouldShowAppearingText={!isInitialVersion}
            skipAnimation={skipAnimation}
            skipPressable={isTemporaryView}
          />
        </View>
        {showSpacer && <View style={{height}} />}
      </React.Fragment>
    );

    const sharedYOffset = useSharedValue(verticalOffset ?? 0);

    useEffect(() => {
      if (scrollTo != null) {
        const callback = () => {
          if (onMomentumScrollEnd) {
            onMomentumScrollEnd();
          }
        };

        sharedYOffset.value = withTiming(
          scrollTo,
          {
            duration: Math.min(scrollTo * 3, 500),
            easing: Easing.inOut(Easing.quad),
          },
          () => runOnJS(callback)(),
        );
      }
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{translateY: -1 * sharedYOffset.value}],
      };
    });

    if (isTemporaryView) {
      return (
        <Animated.View
          style={[styles.scrollView, animatedStyle]}
          onLayout={onLayout}>
          {inner}
        </Animated.View>
      );
    }

    return (
      <Animated.ScrollView
        ref={ref}
        contentOffset={{x: 0, y: verticalOffset ?? 0}}
        onScroll={onScroll}
        style={styles.scrollView}
        onLayout={onLayout}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}>
        {inner}
      </Animated.ScrollView>
    );
  },
  (prevProps, nextProps) =>
    _.isEqual(prevProps.highlightedIndexes, nextProps.highlightedIndexes),
);

const styles = StyleSheet.create({
  container: {
    padding: CONTAINER_PADDING,
    width: '100%',
  },
  invisibleScrollView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  scrollView: {
    flex: 1,
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
    fontSize: 28,
  },
  artistNameText: {
    fontSize: 24,
  },
  albumNameText: {
    fontSize: 24,
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    zIndex: 100,
    borderBottomLeftRadius:
      ITEM_CONTAINER_BORDER_RADIUS - ITEM_CONTAINER_BORDER_WIDTH,
    borderBottomRightRadius:
      ITEM_CONTAINER_BORDER_RADIUS - ITEM_CONTAINER_BORDER_WIDTH,
  },
  button: {
    marginRight: 8,
  },
  selectionButton: {
    minWidth: 128,
  },
});

export default FullLyricsScreen;
