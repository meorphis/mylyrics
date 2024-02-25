import ViewShot from 'react-native-view-shot';
import {StyleSheet, View} from 'react-native';
import React from 'react';
import {BareLyricCard} from '../LyricCard/LyricCard';
import {PassageType} from '../../types/passage';

type Props = {
  passage: PassageType;
  setHeight: ({lyricCardHeight}: {lyricCardHeight: number}) => void;
  viewShotRef: React.RefObject<ViewShot>;
  sharedTransitionKey: string;
  isFlipped: boolean;
};

// a lyric card optimized visually for sharing and wrapped in a ViewShot to
// allow for saving the card as an image
const ShareableLyricCard = (props: Props) => {
  console.log(`rendering ShareablePassageItem ${props.passage.song.name}`);

  const {passage, sharedTransitionKey, setHeight, viewShotRef, isFlipped} = props;

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
          <BareLyricCard
            key={passage.passageKey}
            passage={passage}
            measurementContext={isFlipped ? "ANALYSIS_SHARE_BOTTOM_SHEET" : "SHARE_BOTTOM_SHEET"}
            sharedTransitionKey={sharedTransitionKey}
            omitActionBar
            ignoreFlex
            omitBorder
            shouldUseAnalysis={isFlipped}
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
