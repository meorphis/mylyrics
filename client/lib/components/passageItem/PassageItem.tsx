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

export type PassageItemProps = {
  passage: PassageType;
  passageTheme: ThemeType;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
  captureViewShot: (callback: (uri: string) => void) => void;
};

const PassageItem = (props: PassageItemProps) => {
  console.log(`rendering PassageItem ${props.passageItemKey?.passageKey}`);

  const sharedTransitionKey = useRef<string>(uuidv4()).current;
  const [lyricsYPosition, setLyricsYPosition] = useState<number | null>(null);
  const passageLyricsRef = useRef<View>(null);
  const containerRef = useRef<View>(null);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {passage, passageTheme, passageItemKey, captureViewShot} = props;
  const {lyrics, tags, song} = passage;

  return (
    <ItemContainer theme={passageTheme} containerRef={containerRef}>
      <View style={{...styles.container}}>
        <SongInfo song={song} passageTheme={passageTheme} />
        <PassageLyrics
          song={song}
          lyrics={lyrics}
          theme={passageTheme}
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
          captureViewShot={captureViewShot}
        />
      </View>
    </ItemContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 16,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  hidden: {
    opacity: 0,
  },
});

export default PassageItem;
