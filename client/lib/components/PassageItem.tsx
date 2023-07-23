// renders a passage of lyrics with song metadata and tags;
// will show a loading indicator until the album art has been loaded and the
// theme has been determined, to provide a smoother experience

// NOTE: because we have a nested carousel of carousels, we end up with a lot
// of PassageItems. to ensure good performance, we need to be careful about
// re-renders - in particular, no action should result in O(N*M) re-renders
// of PassageItem or any component nested beneath PassageItem, where N is the
// number of passage groups and M is the number of passages in each

import React, {memo, useEffect, useState} from 'react';
import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';
import StyledText from './StyledText';
import {PassageType} from '../types/passage';
import SongInfo from './SongInfo';
import TagSection from './TagSection';
import LinearGradient from 'react-native-linear-gradient';
import {addColorOpacity} from '../utility/color';
import ThemeType from '../types/theme';
import {useTheme} from '../utility/theme';
import {ImageColorsResult, getColors} from 'react-native-image-colors';

type PassageTheme = {
  passageTheme: ThemeType | undefined;
};

type PassageItemProps = {
  passageKey: string;
  passage: PassageType;
} & PassageTheme;

interface WithPassageThemeProps
  extends Omit<PassageItemProps, keyof PassageTheme> {
  passageIsActive: boolean;
}

const PassageItem = (props: PassageItemProps) => {
  const {passage, passageKey, passageTheme} = props;
  const {lyrics, tags, song} = passage;

  const [imageLoaded, setImageLoaded] = useState(false);

  const image = (
    <Image
      source={{uri: song.album.image}}
      style={styles.albumImage}
      onLoad={() => setImageLoaded(true)}
    />
  );

  const loading = !imageLoaded || passageTheme == null;

  if (loading) {
    return (
      <React.Fragment>
        {/* we need to mount the image, otherwise it will never actually load */}
        <View style={styles.hidden}>{image}</View>
        <ActivityIndicator style={styles.activityIndicator} />
      </React.Fragment>
    );
  }

  const {backgroundColor: passageBackgroundColor} = passageTheme;

  return (
    <React.Fragment>
      {loading && <ActivityIndicator style={styles.activityIndicator} />}
      <LinearGradient
        style={styles.linearGradient}
        colors={[
          addColorOpacity(passageBackgroundColor, 0.75),
          passageBackgroundColor,
        ]}
        start={{x: 0, y: 0.0}}
        end={{x: 0, y: 1}}>
        <SongInfo song={song} passageTheme={passageTheme} loadedImage={image} />
        <View style={styles.lyricsRow}>
          {lyrics.split('\\n').map((line, index) => (
            <StyledText
              key={index}
              style={{...styles.lyricsLine, color: passageTheme.detailColor}}>
              {line}
            </StyledText>
          ))}
        </View>
        <TagSection tags={tags} theme={passageTheme} passageKey={passageKey} />
      </LinearGradient>
    </React.Fragment>
  );
};

// this HOC is responsible for determining the theme for a PassageItem based on
// its album art and then setting the global theme if the passage is currently
// active
const WithPassageTheme = (
  WrappedComponent: React.ComponentType<PassageItemProps>,
) => {
  const ThemedPassageItem: React.FC<WithPassageThemeProps> = props => {
    const {passage, passageIsActive} = props;
    const {image: imageUrl} = passage.song.album;
    const {setTheme: setGlobalTheme} = useTheme();
    const [albumColors, setAlbumColors] = useState<ImageColorsResult | null>(
      null,
    );

    // get the colors for the album art
    useEffect(() => {
      getColors(imageUrl, {quality: 'high'}).then(colors => {
        setAlbumColors(colors);
      });
    }, []);

    // albumColors behaves different on iOS and Android, so we need to normalize
    const theme = albumColors
      ? {
          primaryColor:
            albumColors.platform === 'ios'
              ? albumColors.primary
              : albumColors.vibrant,
          secondaryColor:
            albumColors.platform === 'ios'
              ? albumColors.secondary
              : albumColors.darkVibrant,
          backgroundColor:
            albumColors.platform === 'ios'
              ? albumColors.background
              : albumColors.muted,
          detailColor:
            albumColors.platform === 'ios'
              ? albumColors.detail
              : albumColors.darkMuted,
        }
      : undefined;

    // update the global theme is the passage has become active or the theme has
    // finished loading
    useEffect(() => {
      if (passageIsActive && theme) {
        setGlobalTheme(theme);
      }
    }, [passageIsActive, theme != null]);

    return <WrappedComponent {...props} passageTheme={theme} />;
  };

  return ThemedPassageItem;
};

const styles = StyleSheet.create({
  activityIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  },
  linearGradient: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  albumImage: {
    width: 120,
    height: 120,
  },
  hidden: {
    opacity: 0,
  },
  lyricsRow: {
    padding: 10,
    flex: 1,
  },
  lyricsLine: {
    fontSize: 18,
    color: 'lightgrey',
  },
});

const MemoPassageItem = memo(
  PassageItem,
  (prev: PassageItemProps, next: PassageItemProps) => {
    // use memoization if the passage theme had already been determined
    // or if the passage theme is still loading
    return prev.passageTheme != null || next.passageTheme == null;
  },
);

const MemoPassageItemWithTheme = memo(
  WithPassageTheme(MemoPassageItem),
  (prev: WithPassageThemeProps, next: WithPassageThemeProps) => {
    // use memoization if the passage was already active before or if the
    // is not newly active
    return prev.passageIsActive || !next.passageIsActive;
  },
);

export default MemoPassageItemWithTheme;
