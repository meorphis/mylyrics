// renders a passage of lyrics with song metadata and tags;
// will show a loading indicator until the album art has been loaded and the
// theme has been determined, to provide a smoother experience

// NOTE: because we have a nested carousel of carousels, we end up with a lot
// of PassageItems. to ensure good performance, we need to be careful about
// re-renders - in particular, no action should result in O(N*M) re-renders
// of PassageItem or any component nested beneath PassageItem, where N is the
// number of passage groups and M is the number of passages in each

import React, {memo, useEffect, useRef} from 'react';
import {LayoutChangeEvent, StyleSheet, View} from 'react-native';
import SongInfo from './SongInfo';
import PassageLyrics from './PassageLyrics';
import ActionBar from './ActionBar';
import {useNavigation} from '@react-navigation/core';
import {RootStackParamList} from '../../types/navigation';
import ItemContainer from '../common/ItemContainer';
import {PassageType} from '../../types/passage';
import {CAROUSEL_MARGIN_TOP} from './PassageItemCarousel';
import {useShareablePassageUpdate} from '../../utility/shareable_passage';
import {StackNavigationProp} from '@react-navigation/stack';
import {getPassageId} from '../../utility/passage_id';
import {
  usePassageItemMeasurement,
  useSetPassageItemMeasurement,
} from '../../utility/max_size';
import _ from 'lodash';

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
  const {
    passage,
    passageItemKey,
    omitActionBar,
    ignoreFlex,
    omitBorder,
    maxContainerHeight,
    sharedTransitionKey,
  } = props;
  const {lyrics, tags, song, theme} = passage;

  const containerRef = useRef<View>(null);
  const {setBottomSheetTriggered} = useShareablePassageUpdate();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {lyricsYPosition} = usePassageItemMeasurement();

  console.log(
    `rendering PassageItem ${props.passage.song.name} ${lyricsYPosition}`,
  );

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
          }}>
          <PassageContainer
            passage={passage}
            sharedTransitionKey={sharedTransitionKey}
            containerRef={containerRef}
            maxContainerHeight={maxContainerHeight}
            ignoreFlex={ignoreFlex}
          />
        </View>
        {!omitActionBar && (
          <View style={styles.actionBar}>
            <ActionBar
              passage={passage}
              tags={tags}
              passageItemKey={passageItemKey}
              navigateToFullLyrics={(parentYPosition: number) => {
                navigation.navigate('FullLyrics', {
                  theme,
                  song,
                  sharedTransitionKey: sharedTransitionKey,
                  initiallyHighlightedPassageLyrics: lyrics,
                  parentYPosition,
                  onSelect: 'FULL_PAGE',
                });
              }}
              parentYPosition={lyricsYPosition ?? 0}
              onSharePress={() => {
                setBottomSheetTriggered(true);
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
  sharedTransitionKey: string;
  containerRef: React.RefObject<View>;
  maxContainerHeight?: number;
  ignoreFlex?: boolean;
};

const PassageContainer = (props: PassageContainerProps) => {
  const {
    passage,
    sharedTransitionKey,
    containerRef,
    maxContainerHeight: maxContainerHeightProp,
    ignoreFlex,
  } = props;
  const {song, theme} = passage;
  const passageLyricsRef = useRef<View>(null);

  const {setContentHeight, setMaxContentHeight, setLyricsYPosition} =
    useSetPassageItemMeasurement();

  const {scale, scaleFinalized} = usePassageItemMeasurement();

  console.log(`using scale ${JSON.stringify(scale)}`);

  // if the max container height is explicitly provided, we don't need to wait until
  // the page is laid out to set it
  useEffect(() => {
    if (maxContainerHeightProp != null) {
      setMaxContentHeight(
        maxContainerHeightProp - scale.albumImageSize - scale.songNameSize,
      );
    }
  }, [maxContainerHeightProp, scale.albumImageSize, scale.songNameSize]);

  return (
    <React.Fragment>
      <SongInfo
        song={song}
        passageTheme={theme}
        scale={scale}
        scaleFinalized={scaleFinalized}
      />
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{...styles.passageLyricsContainer, flex: ignoreFlex ? 0 : 1}}
        onLayout={event => {
          if (maxContainerHeightProp == null) {
            setMaxContentHeight(event.nativeEvent.layout.height);
          }
        }}>
        <PassageLyrics
          song={song}
          lyrics={passage.lyrics}
          theme={theme}
          scale={scale}
          scaleFinalized={scaleFinalized}
          sharedTransitionKey={sharedTransitionKey}
          onLayout={(event: LayoutChangeEvent) => {
            passageLyricsRef.current!.measureLayout(
              containerRef.current!,
              (_, y) => {
                setLyricsYPosition(y + CAROUSEL_MARGIN_TOP);
              },
            );

            console.log(
              `lyrics height: ${
                event.nativeEvent.layout.height
              }, passage: ${getPassageId(passage)}`,
            );
            setContentHeight(event.nativeEvent.layout.height);
          }}
          viewRef={passageLyricsRef}
        />
      </View>
    </React.Fragment>
  );
};

const PassageItemMemo = memo(PassageItem, (prev, next) => {
  return _.isEqual(prev.passage.theme, next.passage.theme);
});

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

export default memo(PassageItemMemo, (prev, next) => {
  return _.isEqual(prev.passage.theme, next.passage.theme);
});
