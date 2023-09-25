import React, {memo, useRef} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import SongInfo from './SongInfo';
import PassageLyrics from './PassageLyrics';
import ActionBar from './ActionBar/ActionBar';
import ItemContainer from '../common/ItemContainer';
import {PassageType} from '../../types/passage';
import _ from 'lodash';
import {LyricCardMeasurementContext} from '../../types/measurement';
import {useDispatch, useSelector} from 'react-redux';
import {setMaxContentHeight} from '../../utility/redux/measurement/slice';
import {RootState} from '../../utility/redux';

export const PASSAGE_ITEM_PADDING = 36;

export type LyricCardProps = {
  passage: PassageType;
  measurementContext: LyricCardMeasurementContext;
  sharedTransitionKey: string;
  style?: ViewStyle;
  omitActionBar?: boolean;
  ignoreFlex?: boolean;
  omitBorder?: boolean;
};

// renders a lyric card containing a passage of lyrics with song metadata and tags;
//
// NOTE: because we have a nested carousel of carousels, we end up with a lot
// of LyricCards. to ensure good performance, we need to be careful about
// re-renders - in particular, no action should result in O(N*M) re-renders
// of PassageItem or any component nested beneath PassageItem, where N is the
// number of passage groups and M is the number of passages in each
const LyricCard = (props: LyricCardProps) => {
  const {
    passage,
    measurementContext,
    sharedTransitionKey,
    style,
    omitActionBar,
    ignoreFlex,
    omitBorder,
  } = props;
  console.log(`rendering PassageItem ${props.passage.song.name}`);

  const {theme} = passage;
  const dispatch = useDispatch();

  const maxContentHeight = useSelector((state: RootState) => {
    return state.lyricCardMeasurement.maxContentHeight[measurementContext];
  });

  const containerRef = useRef<View>(null);

  return (
    <ItemContainer
      theme={theme}
      style={style}
      containerRef={containerRef}
      ignoreFlex={ignoreFlex}
      omitBorder={omitBorder}>
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{...styles.container, flex: ignoreFlex ? 0 : 1}}>
        <View
          onLayout={event => {
            // share bottom sheet sets this measurement manually
            if (
              maxContentHeight == null &&
              measurementContext !== 'SHARE_BOTTOM_SHEET'
            ) {
              dispatch(
                setMaxContentHeight({
                  context: measurementContext,
                  value: event.nativeEvent.layout.height,
                }),
              );
            }
          }}
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            ...styles.passageContainer,
            flex: ignoreFlex ? 0 : 1,
          }}>
          <SongInfo passage={passage} measurementContext={measurementContext} />
          <View
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              ...styles.passageLyricsContainer,
              flex: ignoreFlex ? 0 : 1,
            }}>
            <PassageLyrics
              passage={passage}
              sharedTransitionKey={sharedTransitionKey}
              measurementContext={measurementContext}
              containerRef={containerRef}
            />
          </View>
        </View>
        {!omitActionBar && (
          <View style={styles.actionBar}>
            <ActionBar
              passage={passage}
              sharedTransitionKey={sharedTransitionKey}
            />
          </View>
        )}
      </View>
    </ItemContainer>
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
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  hidden: {
    opacity: 0,
  },
});

export default memo(LyricCard, (prev, next) => {
  return (
    _.isEqual(prev.passage.theme, next.passage.theme) &&
    prev.passage.lyrics === next.passage.lyrics
  );
});
