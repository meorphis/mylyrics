// renders a passage of lyrics with song metadata and tags;
// will show a loading indicator until the album art has been loaded and the
// theme has been determined, to provide a smoother experience

// NOTE: because we have a nested carousel of carousels, we end up with a lot
// of PassageItems. to ensure good performance, we need to be careful about
// re-renders - in particular, no action should result in O(N*M) re-renders
// of PassageItem or any component nested beneath PassageItem, where N is the
// number of passage groups and M is the number of passages in each

import React, {useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import SongInfo from './SongInfo';
import PassageLyrics from './PassageLyrics';
import ThemeType from '../../types/theme';
import ActionBar from './ActionBar';
import {NavigationProp, useNavigation} from '@react-navigation/core';
import {RootStackParamList} from '../../types/navigation';
import {uuidv4} from '@firebase/util';
import ItemContainer from '../common/ItemContainer';
import {PassageType} from '../../types/passage';
import {CAROUSEL_MARGIN_TOP} from './PassageItemCarousel';
import {useSharablePassageUpdate} from '../../utility/shareable_passage';
import {useScale, useSetContentHeightForScale} from '../../utility/max_size';

export type PassageItemProps = {
  passage: PassageType;
  passageTheme: ThemeType;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
  omitActionBar?: boolean;
  ignoreFlex?: boolean;
  omitBorder?: boolean;
  onPassageLyricsContainerLayout?: (event: any) => void;
};

const PassageItem = (props: PassageItemProps) => {
  console.log(`rendering PassageItem ${props.passageItemKey?.passageKey}`);

  const sharedTransitionKey = useRef<string>(uuidv4()).current;
  const [lyricsYPosition, setLyricsYPosition] = useState<number | null>(null);
  const containerRef = useRef<View>(null);
  const setSharablePassage = useSharablePassageUpdate();

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    passage,
    passageTheme,
    passageItemKey,
    omitActionBar,
    ignoreFlex,
    omitBorder,
    onPassageLyricsContainerLayout,
  } = props;
  const {lyrics, tags, song} = passage;

  return (
    <ItemContainer
      theme={passageTheme}
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
            passageTheme={passageTheme}
            sharedTransitionKey={sharedTransitionKey}
            onPassageLyricsContainerLayout={onPassageLyricsContainerLayout}
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
              theme={passageTheme}
              passageItemKey={passageItemKey}
              navigateToFullLyrics={() => {
                navigation.navigate('FullLyrics', {
                  theme: passageTheme,
                  song: song,
                  sharedTransitionKey: sharedTransitionKey,
                  initiallyHighlightedPassageLyrics: lyrics,
                  parentYPosition: lyricsYPosition || 0,
                });
              }}
              onSharePress={() => {
                setSharablePassage(passage);
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
  passageTheme: ThemeType;
  sharedTransitionKey: string;
  setLyricsYPosition: (y: number) => void;
  containerRef: React.RefObject<View>;
  onPassageLyricsContainerLayout?: (event: any) => void;
  ignoreFlex?: boolean;
};

const PassageContainer = (props: PassageContainerProps) => {
  const {
    passage,
    passageTheme,
    sharedTransitionKey,
    setLyricsYPosition,
    containerRef,
    onPassageLyricsContainerLayout,
    ignoreFlex,
  } = props;
  const {song} = passage;

  const setContentHeightForScale = useSetContentHeightForScale();
  const passageLyricsRef = useRef<View>(null);
  const scale = useScale();

  return (
    <React.Fragment>
      <SongInfo song={song} passageTheme={passageTheme} scale={scale} />
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{...styles.passageLyricsContainer, flex: ignoreFlex ? 0 : 1}}
        onLayout={event => {
          if (onPassageLyricsContainerLayout) {
            onPassageLyricsContainerLayout(event);
          }
        }}>
        <PassageLyrics
          song={song}
          lyrics={passage.lyrics}
          theme={passageTheme}
          scale={scale}
          sharedTransitionKey={sharedTransitionKey}
          onLayout={event => {
            const {height} = event.nativeEvent.layout;
            setContentHeightForScale({height, scaleIndex: scale.index});

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
    margin: 20,
    padding: 16,
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
