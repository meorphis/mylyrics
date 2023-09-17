// renders a passage of lyrics with song metadata and tags;
// will show a loading indicator until the album art has been loaded and the
// theme has been determined, to provide a smoother experience

// NOTE: because we have a nested carousel of carousels, we end up with a lot
// of PassageItems. to ensure good performance, we need to be careful about
// re-renders - in particular, no action should result in O(N*M) re-renders
// of PassageItem or any component nested beneath PassageItem, where N is the
// number of passage groups and M is the number of passages in each

import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import SongInfo from './SongInfo';
import PassageLyrics from './PassageLyrics';
import ActionBar from './ActionBar';
import {useNavigation} from '@react-navigation/core';
import {RootStackParamList} from '../../types/navigation';
import ItemContainer from '../common/ItemContainer';
import {PassageType} from '../../types/passage';
import {CAROUSEL_MARGIN_TOP} from './PassageItemCarousel';
import {useShareablePassageUpdate} from '../../utility/shareable_passage';
import {
  DEFAULT_SCALE,
  ScaleInfoType,
  useGetScaleForContainerHeight,
} from '../../utility/max_size';
import {StackNavigationProp} from '@react-navigation/stack';

export const PASSAGE_ITEM_PADDING = 36;

export type PassageItemPropsWithoutSharedTransitionKey = {
  passage: PassageType;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
  omitActionBar?: boolean;
  ignoreFlex?: boolean;
  omitBorder?: boolean;
  maxContainerHeight?: number;
};

export type PassageItemProps = PassageItemPropsWithoutSharedTransitionKey & {
  sharedTransitionKey: string;
};

const PassageItem = (props: PassageItemProps) => {
  console.log(`rendering PassageItem ${props.passage.song.name}`);

  const [lyricsYPosition, setLyricsYPosition] = useState<number | null>(null);
  const containerRef = useRef<View>(null);
  const setShareablePassage = useShareablePassageUpdate();

  const getScaleForContainerHeight = useGetScaleForContainerHeight();
  const [scaleInfo, setScaleInfo] = useState<ScaleInfoType>({
    scale: DEFAULT_SCALE,
    computed: false,
  });

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {
    passage,
    passageItemKey,
    omitActionBar,
    ignoreFlex,
    omitBorder,
    maxContainerHeight: maxContainerHeightProp,
    sharedTransitionKey,
  } = props;
  const {lyrics, tags, song, theme} = passage;

  useEffect(() => {
    if (maxContainerHeightProp) {
      const computedScale = getScaleForContainerHeight({
        containerHeight: maxContainerHeightProp,
        numTextLines: lyrics.split('\n').length,
        actionBarHeight: omitActionBar ? 0 : 48,
      });

      setScaleInfo({
        scale: computedScale,
        computed: true,
      });
    }
  }, []);

  return (
    <ItemContainer
      theme={theme}
      containerRef={containerRef}
      ignoreFlex={ignoreFlex}
      omitBorder={omitBorder}>
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{...styles.container, flex: ignoreFlex ? 0 : 1}}>
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            ...styles.passageContainer,
            flex: ignoreFlex ? 0 : 1,
          }}
          onLayout={event => {
            if (!scaleInfo.computed) {
              const computedScale = getScaleForContainerHeight({
                containerHeight: event.nativeEvent.layout.height,
                numTextLines: lyrics.split('\n').length,
                actionBarHeight: omitActionBar ? 0 : 48,
              });

              setScaleInfo({
                scale: computedScale,
                computed: true,
              });
            }
          }}>
          <PassageContainer
            passage={passage}
            scaleInfo={scaleInfo}
            sharedTransitionKey={sharedTransitionKey}
            setLyricsYPosition={setLyricsYPosition}
            containerRef={containerRef}
            ignoreFlex={ignoreFlex}
          />
        </View>
        {!omitActionBar && (
          <View style={styles.actionBar}>
            <ActionBar
              passage={passage}
              tags={tags}
              passageItemKey={passageItemKey}
              navigateToFullLyrics={() => {
                navigation.navigate('FullLyrics', {
                  theme,
                  song,
                  sharedTransitionKey: sharedTransitionKey,
                  initiallyHighlightedPassageLyrics: lyrics,
                  parentYPosition: lyricsYPosition || 0,
                  onSelect: 'FULL_PAGE',
                });
              }}
              onSharePress={() => {
                setShareablePassage(passage);
              }}
            />
          </View>
        )}
      </View>
    </ItemContainer>
  );
};

type PassageContainerProps = {
  passage: PassageType;
  scaleInfo: ScaleInfoType;
  sharedTransitionKey: string;
  setLyricsYPosition: (y: number) => void;
  containerRef: React.RefObject<View>;
  ignoreFlex?: boolean;
};

const PassageContainer = (props: PassageContainerProps) => {
  const {
    passage,
    scaleInfo,
    sharedTransitionKey,
    setLyricsYPosition,
    containerRef,
    ignoreFlex,
  } = props;
  const {song, theme} = passage;

  const passageLyricsRef = useRef<View>(null);

  return (
    <React.Fragment>
      <SongInfo song={song} passageTheme={theme} scaleInfo={scaleInfo} />
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{...styles.passageLyricsContainer, flex: ignoreFlex ? 0 : 1}}>
        <PassageLyrics
          song={song}
          lyrics={passage.lyrics}
          theme={theme}
          scaleInfo={scaleInfo}
          sharedTransitionKey={sharedTransitionKey}
          onLayout={() => {
            passageLyricsRef.current!.measureLayout(
              containerRef.current!,
              (_, y) => {
                setLyricsYPosition(y + CAROUSEL_MARGIN_TOP);
              },
            );
          }}
          viewRef={passageLyricsRef}
        />
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: PASSAGE_ITEM_PADDING,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  passageContainer: {
    flex: 1,
  },
  passageLyricsContainer: {
    flex: 1,
  },
  actionBar: {
    justifyContent: 'flex-end',
  },
  hidden: {
    opacity: 0,
  },
});

export default PassageItem;
