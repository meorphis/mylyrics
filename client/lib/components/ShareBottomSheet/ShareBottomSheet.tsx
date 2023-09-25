import {useCallback, useEffect, useRef, useState} from 'react';
import ViewShot from 'react-native-view-shot';
import React from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {uuidv4} from '@firebase/util';
import {Dimensions, StyleSheet, View} from 'react-native';
import {PASSAGE_ITEM_PADDING} from '../LyricCard/LyricCard';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {isColorLight} from '../../utility/helpers/color';
import ShareableLyricCard from './ShareableLyricCard';
import ControlPanel, {CONTROL_PANEL_HEIGHTS} from './ControlPanel';
import {useBottomSheetBackdrop} from '../../utility/helpers/bottom_sheet';
import {
  useBottomSheetTriggered,
  useShareablePassage,
} from '../../utility/redux/shareable_passage/selectors';
import {useDispatch} from 'react-redux';
import {setBottomSheetTriggered} from '../../utility/redux/shareable_passage/slice';
import {setMaxContentHeight} from '../../utility/redux/measurement/slice';

export const BOTTOM_SHEET_HANDLE_HEIGHT = 24;

// bottom sheet to show a shareable LyricCard and some edit controls
const ShareBottomSheet = () => {
  console.log('rendering ShareBottomSheet');

  const bottomSheetTriggered = useBottomSheetTriggered();
  const shareablePassage = useShareablePassage();
  const dispatch = useDispatch();

  const {passage, customization} = shareablePassage;
  const {themeSelection, textColorSelection} = customization;

  const {theme: baseSelectedTheme, inverted} = themeSelection;

  const selectedTheme = inverted
    ? baseSelectedTheme.invertedTheme!
    : baseSelectedTheme;

  // POSITIONING: we need to compute (1) the maximum space we can allow the lyric card's passage
  // container component to take up (we provide this value to redux which will enforce this maximum),
  // and (2) the snap point for the bottom sheet
  //
  // first, we add up the space taken up by element other than the lyrics card; we can allow the
  // passage container to take up the entire size of the screen minus the space taken up this
  // non-lyrics card content, the sizes of the insets and the lyric card padding
  //
  // the lyrics card will tell us its height with the setLyricCardHeight callback, so once we add
  // that to the non-lyrics card height and the bottom inset, we have the snap point
  const {height: windowHeight} = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const nonLyricCardHeight =
    BOTTOM_SHEET_HANDLE_HEIGHT +
    CONTROL_PANEL_HEIGHTS.margin_top +
    CONTROL_PANEL_HEIGHTS.editor_height +
    2 * CONTROL_PANEL_HEIGHTS.editor_margin;

  // minimum amount of space to leave between the top of the bottom sheet and the top
  // of the screen
  const buffer = 12;
  const maxLyricCardHeight =
    windowHeight - insets.top - insets.bottom - nonLyricCardHeight - buffer;
  const maxPassageContainerHeight =
    maxLyricCardHeight - 2 * PASSAGE_ITEM_PADDING;

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [snapPoint, setSnapPoint] = useState<number>(1000);

  const setLyricCardHeight = useCallback(
    ({lyricCardHeight}: {lyricCardHeight: number}) => {
      const newSnapPoint = lyricCardHeight + nonLyricCardHeight + insets.bottom;
      if (newSnapPoint !== snapPoint) {
        setSnapPoint(newSnapPoint);
      }
    },
    [],
  );

  // set the max content height in the redux store for measurements and scaling
  useEffect(() => {
    dispatch(
      setMaxContentHeight({
        context: 'SHARE_BOTTOM_SHEET',
        value: maxPassageContainerHeight,
      }),
    );
  }, [maxPassageContainerHeight]);

  // OTHER CONFIGURATION
  const sharedTransitionKey = useRef<string>(uuidv4()).current;
  const viewShotRef = useRef<ViewShot>(null);

  // if we're meant to trigger the bottom sheet, trigger it and then reset the
  // trigger flag
  useEffect(() => {
    if (bottomSheetTriggered) {
      bottomSheetRef.current?.expand();
    }

    dispatch(setBottomSheetTriggered(false));
  }, [bottomSheetTriggered]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[snapPoint]}
      enablePanDownToClose
      backdropComponent={useBottomSheetBackdrop({opacity: 0.9})}
      // eslint-disable-next-line react-native/no-inline-styles
      handleIndicatorStyle={{
        backgroundColor: isColorLight(selectedTheme.farBackgroundColor)
          ? '#00000040'
          : '#ffffff40',
      }}
      backgroundStyle={{
        backgroundColor: selectedTheme.farBackgroundColor,
      }}
      containerStyle={{...styles.container}}
      handleHeight={BOTTOM_SHEET_HANDLE_HEIGHT}>
      <View style={styles.passageEditor}>
        <ShareableLyricCard
          passage={{
            ...passage,
            theme: {
              ...selectedTheme,
              textColors: [textColorSelection],
            },
          }}
          setHeight={setLyricCardHeight}
          viewShotRef={viewShotRef}
          sharedTransitionKey={sharedTransitionKey}
        />
      </View>
      <ControlPanel
        snapPoint={snapPoint}
        bottomSheetTriggered={bottomSheetTriggered}
        sharedTransitionKey={sharedTransitionKey}
        viewShotRef={viewShotRef}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  passageEditor: {
    alignSelf: 'center',
    borderRadius: 32,
  },
  hidden: {
    opacity: 0,
  },
});

export default ShareBottomSheet;
