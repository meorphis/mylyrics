import React, {memo, useEffect, useRef, useState} from 'react';
import {StyleSheet, View, ViewStyle, Text, LayoutChangeEvent} from 'react-native';
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
import Animated, { SharedValue, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { acknowledgeAutoflip, toggleFlippedState } from '../../utility/redux/card_flip/slice';
import { useShouldAutoFlip } from '../../utility/redux/card_flip/selectors';

export const PASSAGE_ITEM_PADDING = 36;

export type LyricCardProps = {
  passage: PassageType;
  bundleKey?: string;
  measurementContext: LyricCardMeasurementContext;
  sharedTransitionKey: string;
  containerStyle?: ViewStyle;
  omitActionBar?: boolean;
  ignoreFlex?: boolean;
  omitBorder?: boolean;
  excludeBack?: boolean;
};

// renders a lyric card containing a passage of lyrics with song metadata and tags;
//
// NOTE: because we have a nested carousel of carousels, we end up with a lot
// of LyricCards. to ensure good performance, we need to be careful about
// re-renders - in particular, no action should result in O(N*M) re-renders
// of LyricCard or any component nested beneath LyricCard, where N is the
// number of passage groups and M is the number of passages in each
const _FlippableLyricCard = (props: LyricCardProps) => {
  console.log(`rendering LyricCard ${props.passage.song.name}`);

  const {ignoreFlex, bundleKey, passage} = props;

  const dispatch = useDispatch();

  const shouldAutoflip = useShouldAutoFlip({bundleKey: bundleKey ?? "", passageKey: passage.passageKey})

  const rotation = useSharedValue(0);
  const [isRotated, setIsRotated] = useState(false);

  const rotate = () => {
    rotation.value = rotation.value ? 0 : 1;
    setIsRotated((r) => !r);
    if (bundleKey) {
      dispatch(toggleFlippedState({bundleKey, passageKey: passage.passageKey}))
    }
  }

  useEffect(() => {
    if (shouldAutoflip) {
      dispatch(acknowledgeAutoflip());
      setTimeout(rotate, 2000);
    }
  }, [shouldAutoflip])

  const [cardHeight, setCardHeight] = useState(0);

  return <View style={{flex: ignoreFlex ? 0 : 1}}>
    <LyricCardFront {...props} rotation={rotation} rotate={rotate} setCardHeight={setCardHeight} isVisible={!isRotated}/>
    {props.passage.analysis && <LyricCardBack {...props} rotation={rotation} rotate={rotate} 
      cardHeight={cardHeight} isVisible={isRotated}
      measurementContext={"ANALYSIS_" + props.measurementContext as LyricCardMeasurementContext}
    />}
  </View>
};

const LyricCardFront = (props: LyricCardProps & {
  rotation: SharedValue<number>,
  rotate: () => void,
  setCardHeight: (h: number) => void,
  isVisible: boolean,
}) => {
  const {rotation} = props;

  const frontAnimatedStyles = useAnimatedStyle(()=>{
    const rotateValue = interpolate(rotation.value,[0,1],[0,180])
    return {
      transform:[
        {
          rotateY : withTiming(`${rotateValue}deg`,{duration:1000})
        }
      ],
      ...styles.frontCard
    }
  })

  return <BareLyricCard {...props} style={frontAnimatedStyles} />
}


const LyricCardBack = (props: LyricCardProps & {
  rotation: SharedValue<number>,
  rotate: () => void,
  cardHeight: number,
  isVisible: boolean
}) => {
  const {rotation, cardHeight} = props;

  const backAnimatedStyles = useAnimatedStyle(()=>{
    const rotateValue = interpolate(rotation.value,[0,1],[180,360])
    return{
      transform: [
        {
          rotateY : withTiming(`${rotateValue}deg`, {duration:1000})
        }
      ],
      ...styles.backCard,
    }
  })

  const frontCardContentHeight = useSelector((state: RootState) => {
    return state.lyricCardMeasurement.maxContentHeight["MAIN_SCREEN"];
  });
  
  return cardHeight && frontCardContentHeight ? (
    <BareLyricCard
      {...props}
      style={backAnimatedStyles}
      cardHeightOverride={cardHeight}
      cardContentHeightOverride={frontCardContentHeight}
      shouldUseAnalysis
    />) : null;
}

export const BareLyricCard = (props: LyricCardProps & {
  rotate?: () => void,
  setCardHeight?: (h: number) => void,
  isVisible?: boolean,
  style?: ViewStyle,
  cardContentHeightOverride?: number;
  cardHeightOverride?: number;
  shouldUseAnalysis?: boolean;
}) => {
  const {
    passage,
    measurementContext,
    sharedTransitionKey,
    omitActionBar,
    ignoreFlex,
    style = {},
    containerStyle = {},
    omitBorder,
    rotate = () => {},
    setCardHeight = () => {},
    isVisible = true,
    cardHeightOverride,
    cardContentHeightOverride,
    shouldUseAnalysis = false,
  } = props;

  const dispatch = useDispatch();

  const containerRef = useRef<View>(null);

  const maxContentHeight = useSelector((state: RootState) => {
    return state.lyricCardMeasurement.maxContentHeight[measurementContext];
  });

  return <Animated.View style={[style, isVisible ? styles.zIndex1 : {}, ignoreFlex ? {flex: 0} : {flex: 1}]}>
    <ItemContainer
      theme={passage.theme}
      style={{...containerStyle, ...(cardHeightOverride ? {height: cardHeightOverride} : {})}}
      containerRef={containerRef}
      ignoreFlex={ignoreFlex}
      onLayout={(event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        setCardHeight(height); 
      }}
      omitBorder={omitBorder}>
      <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        ...styles.container,
        flex: ignoreFlex ? 0 : 1,
        paddingBottom: omitActionBar ? undefined : 24,
      }}>
      <View
        onLayout={event => {
          // share bottom sheet sets this measurement manually
          if (
            maxContentHeight == null &&
            !measurementContext.includes('SHARE_BOTTOM_SHEET')
          ) {
            dispatch(
              setMaxContentHeight({
                context: measurementContext,
                value: cardContentHeightOverride ?? event.nativeEvent.layout.height,
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
            shouldUseAnalysis={shouldUseAnalysis}
          />
        </View>
      </View>
      {!omitActionBar && (
        <View style={styles.actionBar}>
          <ActionBar
            passage={passage}
            sharedTransitionKey={sharedTransitionKey}
            rotate={rotate}
            shouldUseAnalysis={shouldUseAnalysis}
          />
        </View>
      )}
    </View>
    </ItemContainer>
  </Animated.View>
}

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
  frontCard:{
    flex: 1,
    backfaceVisibility:'hidden'
  },
  backCard:{
    flex: 1,
    position: "absolute",
    backfaceVisibility: "hidden",
  },
  zIndex1: {
    zIndex: 1,
  }
});

export const FlippableLyricCard = memo(_FlippableLyricCard, (prev, next) => {
  return (
    _.isEqual(prev.passage.theme, next.passage.theme) &&
    prev.passage.lyrics === next.passage.lyrics
  );
});
