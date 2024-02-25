import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
// import DrawProphecyCardButton from './DrawProphecyCardButton';
import LikeButton from './LikeButton';
import FullLyricsButton from './FullLyricsButton';
import ShareButton from './ShareButton';
import {PassageType} from '../../../types/passage';
import RotateButton from './RotateButton';

type Props = {
  passage: PassageType;
  sharedTransitionKey: string;
  rotate: () => void;
  shouldUseAnalysis: boolean
};

// section to display at the bottom of a LyricsCard with actions that the user
// can take on the passage
const ActionBar = (props: Props) => {
  console.log(`rendering ActionBar ${props.passage.song.name}`);

  const {passage, sharedTransitionKey, rotate, shouldUseAnalysis} = props;

  return (
    <View style={styles.actionBar}>
      <View style={[styles.buttonContainer, shouldUseAnalysis ? styles.spaceEvenly : styles.spaceBetween]}>
        {!shouldUseAnalysis && <LikeButton passage={passage}/>}
        {/* <DrawProphecyCardButton passage={passage} /> */}
        <ShareButton theme={passage.theme} />
        {!shouldUseAnalysis && <FullLyricsButton
          passage={passage}
          sharedTransitionKey={sharedTransitionKey}
        />}
        {passage.analysis && <RotateButton passage={passage} rotate={rotate} shouldUseAnalysis={shouldUseAnalysis} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'column',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  spaceEvenly: {
    justifyContent: 'space-evenly',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
  },
});

export default memo(
  ActionBar,
  (prevProps, nextProps) =>
    prevProps.passage.lyrics === nextProps.passage.lyrics,
);
