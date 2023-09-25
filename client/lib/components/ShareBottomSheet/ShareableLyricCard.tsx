import ViewShot from 'react-native-view-shot';
import {StyleSheet, View} from 'react-native';
import React from 'react';
import LyricCard from '../PassageItem/LyricCard';
import {PassageType} from '../../types/passage';

type Props = {
  passage: PassageType;
  setHeight: ({lyricCardHeight}: {lyricCardHeight: number}) => void;
  viewShotRef: React.RefObject<ViewShot>;
  sharedTransitionKey: string;
};

// a lyric card optimized visually for sharing and wrapped in a ViewShot to
// allow for saving the card as an image
const ShareableLyricCard = (props: Props) => {
  console.log(`rendering ShareablePassageItem ${props.passage.song.name}`);

  const {passage, sharedTransitionKey, setHeight, viewShotRef} = props;

  return (
    <View
      onLayout={(event: any) => {
        const {height} = event.nativeEvent.layout;
        setHeight({lyricCardHeight: height});
      }}
      style={{
        ...styles.container,
      }}>
      <ViewShot ref={viewShotRef} options={{format: 'png'}}>
        {passage && (
          <LyricCard
            key={passage.passageKey}
            passage={passage}
            measurementContext="SHARE_BOTTOM_SHEET"
            sharedTransitionKey={sharedTransitionKey}
            omitActionBar
            ignoreFlex
            omitBorder
          />
        )}
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    minWidth: '90%',
    maxWidth: '90%',
  },
});

export default ShareableLyricCard;
