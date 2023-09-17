import {useCallback, useRef, useState} from 'react';
import ViewShot from 'react-native-view-shot';
import React from 'react';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {uuidv4} from '@firebase/util';
import {Dimensions, StyleSheet, View} from 'react-native';
import {
  ShareablePassage,
  useShareablePassage,
} from '../../../utility/shareable_passage';
import {PASSAGE_ITEM_PADDING} from '../PassageItem';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {isColorLight} from '../../../utility/color';
import ShareablePassageItem from './ShareablePassageItem';
import ControlPanel, {CONTROL_PANEL_HEIGHTS} from './ControlPanel';

const BOTTOM_SHEET_HANDLE_HEIGHT = 24;

const ShareBottomSheet = () => {
  console.log('rendering ShareBottomSheet');

  const shareablePassage = useShareablePassage();

  if (shareablePassage === null) {
    return null;
  }

  return <ShareBottomSheetInner shareablePassage={shareablePassage} />;
};

const ShareBottomSheetInner = ({
  shareablePassage,
}: {
  shareablePassage: ShareablePassage;
}) => {
  const {theme} = shareablePassage.passage;

  // POSITIONING: we need to compute (1) the maximum space we can allow the lyric card's passage
  // container component to take up (we provide this value as a paramter to the PassageItem which
  // will enforce this maximum), and (2) the snap point for the bottom sheet
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
  const [snapPoint, setSnapPoint] = useState<number>(1);

  const setLyricCardHeight = useCallback(
    ({lyricCardHeight, expand}: {lyricCardHeight: number; expand: boolean}) => {
      const newSnapPoint = lyricCardHeight + nonLyricCardHeight + insets.bottom;
      if (newSnapPoint !== snapPoint) {
        setSnapPoint(newSnapPoint);
        // slight delay because the animation is smoother if the snap points
        // are already updated by the time we expand the bottom sheet
        if (expand) {
          setTimeout(() => {
            bottomSheetRef.current?.expand();
          }, 50);
        }
      } else {
        if (expand) {
          bottomSheetRef.current?.expand();
        }
      }
    },
    [],
  );

  // OTHER CONFIGURATION
  const sharedTransitionKey = useRef<string>(uuidv4()).current;
  const viewShotRef = useRef<ViewShot>(null);
  const renderBackdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.9}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[snapPoint]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      // eslint-disable-next-line react-native/no-inline-styles
      handleIndicatorStyle={{
        backgroundColor: isColorLight(theme.farBackgroundColor)
          ? '#00000040'
          : '#ffffff40',
      }}
      backgroundStyle={{
        backgroundColor: theme.farBackgroundColor,
      }}
      containerStyle={{...styles.container}}
      handleHeight={BOTTOM_SHEET_HANDLE_HEIGHT}>
      <View style={styles.passageEditor}>
        {shareablePassage && (
          <ShareablePassageItem
            shareablePassage={shareablePassage}
            maxContainerHeight={maxPassageContainerHeight}
            setHeight={setLyricCardHeight}
            viewShotRef={viewShotRef}
            sharedTransitionKey={sharedTransitionKey}
          />
        )}
      </View>
      <ControlPanel
        shareablePassage={shareablePassage}
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
