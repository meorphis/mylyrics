// renders a passage of lyrics with song metadata and tags;
// will show a loading indicator until the album art has been loaded and the
// theme has been determined, to provide a smoother experience

// NOTE: because we have a nested carousel of carousels, we end up with a lot
// of PassageItems. to ensure good performance, we need to be careful about
// re-renders - in particular, no action should result in O(N*M) re-renders
// of PassageItem or any component nested beneath PassageItem, where N is the
// number of passage groups and M is the number of passages in each

import React, {memo, useRef, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, View} from 'react-native';
import {PassageType} from '../../types/passage';
import SongInfo from './SongInfo';
import PassageLyrics from './PassageLyrics';
import ThemeType from '../../types/theme';
import NonLoadedPassageItem from './NonLoadedPassageItem';
import FastImage from 'react-native-fast-image';
import ActionBar from './ActionBar';
import {NavigationProp, useNavigation} from '@react-navigation/core';
import {RootStackParamList} from '../../types/navigation';
import {uuidv4} from '@firebase/util';
import ItemContainer from '../common/ItemContainer';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export type PassageItemProps = {
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
  passage: PassageType | null;
  passageTheme: ThemeType | undefined;
};

const PassageItem = (props: PassageItemProps) => {
  console.log(`rendering PassageItem ${props.passageItemKey?.passageKey}`);

  const sharedTransitionKey = useRef<string>(uuidv4()).current;
  const [lyricsYPosition, setLyricsYPosition] = useState<number | null>(null);

  const insets = useSafeAreaInsets();

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {passage, passageTheme, passageItemKey} = props;
  const {lyrics, tags, song} = passage || {
    lyrics: '',
    tags: [],
    song: {
      name: '',
      artists: [{name: ''}],
      album: {
        name: '',
        image: '',
      },
      lyrics: '',
    },
  };

  const [imageLoaded, setImageLoaded] = useState(false);
  // const {theme: globalTheme} = useTheme();

  let image = null;
  if (song.album.image) {
    image = (
      <FastImage
        source={{uri: song.album.image}}
        style={styles.albumImage}
        onLoad={() => {
          console.log(`image loaded for ${passageItemKey?.passageKey}`);
          setImageLoaded(true);
        }}
      />
    );
  }

  const loading = !imageLoaded || passageTheme == null;

  if (loading) {
    return (
      <ItemContainer>
        {/* we need to mount the image, otherwise it will never actually load */}
        <View style={styles.hidden}>{image}</View>
        <NonLoadedPassageItem dataStatus="loading" message="Loading..." />
      </ItemContainer>
    );
  }

  return (
    <ItemContainer theme={passageTheme}>
      <View
        style={{...styles.container, borderColor: passageTheme.detailColor}}>
        <SongInfo song={song} passageTheme={passageTheme} loadedImage={image} />
        <PassageLyrics
          song={song}
          lyrics={lyrics}
          theme={passageTheme}
          sharedTransitionKey={sharedTransitionKey}
          onLayout={(e: LayoutChangeEvent) => {
            setLyricsYPosition(e.nativeEvent.layout.y);
          }}
        />
        <ActionBar
          tags={tags}
          theme={passageTheme}
          passageItemKey={passageItemKey}
          navigateToFullLyrics={() => {
            navigation.navigate('FullLyrics', {
              theme: passageTheme,
              song: song,
              sharedTransitionKey: sharedTransitionKey,
              initiallyHighlightedPassageLyrics: lyrics,
              parentYPosition: (lyricsYPosition || 0) + insets.top,
            });
          }}
        />
      </View>
    </ItemContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'white',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  albumImage: {
    width: 100,
    height: 100,
  },
  hidden: {
    opacity: 0,
  },
});

const MemoPassageItem = memo(
  PassageItem,
  (prev: PassageItemProps, next: PassageItemProps) => {
    // only re-render when the passage theme has been determined
    return prev.passageTheme != null || next.passageTheme == null;
  },
);

export default MemoPassageItem;
