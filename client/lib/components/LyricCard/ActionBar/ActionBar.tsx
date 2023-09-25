import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import DrawProphecyCardButton from './DrawProphecyCardButton';
import LikeButton from './LikeButton';
import FullLyricsButton from './FullLyricsButton';
import ShareButton from './ShareButton';
import {PassageType} from '../../../types/passage';

type Props = {
  passage: PassageType;
  sharedTransitionKey: string;
};

// section to display at the bottom of a LyricsCard with actions that the user
// can take on the passage
const ActionBar = (props: Props) => {
  console.log(`rendering ActionBar ${props.passage.song.name}`);

  const {passage, sharedTransitionKey} = props;

  return (
    <View style={styles.actionBar}>
      <View style={styles.buttonContainer}>
        <LikeButton passage={passage} />
        <DrawProphecyCardButton passage={passage} />
        <ShareButton theme={passage.theme} />
        <FullLyricsButton
          passage={passage}
          sharedTransitionKey={sharedTransitionKey}
        />
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
    justifyContent: 'space-around',
    marginTop: 8,
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
