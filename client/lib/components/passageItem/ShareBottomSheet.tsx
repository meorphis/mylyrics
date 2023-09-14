import {useCallback, useEffect, useRef, useState} from 'react';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import React from 'react';
import tinycolor from 'tinycolor2';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {Dimensions, StyleSheet, View} from 'react-native';
import {useTheme} from '../../utility/theme';
import {
  SharablePassage,
  useSharablePassage,
} from '../../utility/shareable_passage';
import {getPassageId} from '../../utility/passage_id';
import PassageItem from './PassageItem';
import ThemeType from '../../types/theme';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {getFurthestColor, getLyricsColor} from '../../utility/lyrics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ScaleProvider, useScale} from '../../utility/max_size';
import {
  addColorOpacity,
  colorDistanceHsl,
  ensureColorContrast2,
  isColorLight,
} from '../../utility/color';
import ShareButton from './ShareButton';

const ShareBottomSheet = () => {
  console.log('rendering ShareBottomSheet');

  const bottomSheetRef = useRef<BottomSheet>(null);

  const sharablePassage = useSharablePassage();

  const defaultTheme = useTheme();

  const [passageTheme, setPassageTheme] = useState<ThemeType>(defaultTheme);

  useEffect(() => {
    setPassageTheme(defaultTheme);
  }, [defaultTheme]);

  const altThemes = [
    defaultTheme.primaryColor,
    defaultTheme.secondaryColor,
    defaultTheme.detailColor,
  ].map(backgroundColor => {
    const contrastColor = getFurthestColor({
      subject: backgroundColor,
      options: [
        defaultTheme.primaryColor,
        defaultTheme.secondaryColor,
        defaultTheme.detailColor,
        defaultTheme.backgroundColor,
      ],
      ensureContrast: true,
    });

    return {
      backgroundColor,
      contrastColor,
      primaryColor: contrastColor,
      secondaryColor: contrastColor,
      detailColor: contrastColor,
    };
  });

  const [snapPoint, setSnapPoint] = useState<string | number>('100%');
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

  const {height: windowHeight} = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  // subtract 40 to ensure a bit of buffer at the top to make it easy to close the bottom sheet
  const maxBottomSheetHeight = windowHeight - insets.top - 40;

  const setHeight = useCallback(
    (height: number) => {
      // 180 is sort of a magic number to make sure the bottom sheet has room for the
      // color changer and share buttons
      const newSnapPoint = height + insets.bottom + 180;

      if (newSnapPoint !== snapPoint) {
        setSnapPoint(newSnapPoint);
        // slight delay because the animation is smoother if the snap points
        // are already updated by the time we expand the bottom sheet
        setTimeout(() => {
          bottomSheetRef.current?.expand();
        }, 50);
      } else {
        bottomSheetRef.current?.expand();
      }
    },
    [setSnapPoint],
  );

  // yet another magic number - 350 should be enough room for the rest of the passage
  // item as well as the color changer and share buttons
  const maxLyricsSize = maxBottomSheetHeight - insets.bottom - 350;

  let backgroundColorTc = tinycolor(passageTheme.backgroundColor).toHsl();

  if (backgroundColorTc.l > 0.8) {
    backgroundColorTc.l -= 0.1;
  } else {
    backgroundColorTc.l = Math.min((backgroundColorTc.l + 1) / 2, 0.9);
  }

  const backgroundColor = getContrastLayer(passageTheme.backgroundColor);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[snapPoint]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: backgroundColor,
      }}
      containerStyle={{...styles.container, paddingBottom: insets.bottom}}>
      <View style={styles.passageEditor}>
        {sharablePassage && (
          <ScaleProvider
            key={getPassageId(sharablePassage.passage)}
            maxSize={maxLyricsSize}>
            <SharableComponent
              sharablePassage={sharablePassage}
              passageTheme={passageTheme}
              setHeight={setHeight}
              viewShotRef={viewShotRef}
            />
          </ScaleProvider>
        )}
        <View style={styles.themeOptions}>
          {[
            {
              ...defaultTheme,
              contrastColor: getLyricsColor({theme: defaultTheme}),
            },
            ...altThemes,
          ].map((theme, index) => (
            <TouchableOpacity
              style={{
                ...styles.themeOption,
                backgroundColor: theme.backgroundColor,
                borderColor: addColorOpacity(
                  isColorLight(backgroundColor) ? '#000000' : '#ffffff',
                  0.5,
                ),
              }}
              key={index}
              onPress={() => setPassageTheme(theme)}>
              {theme.backgroundColor === passageTheme.backgroundColor && (
                <View
                  style={{
                    ...styles.selectedIndicator,
                    backgroundColor: theme.contrastColor,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.shareButtons}>
        <ShareButton
          shareType={Share.Social.INSTAGRAM_STORIES}
          backgroundColor={backgroundColor}
          viewShotRef={viewShotRef}
        />
        <ShareButton
          shareType={'other'}
          backgroundColor={backgroundColor}
          viewShotRef={viewShotRef}
        />
      </View>
    </BottomSheet>
  );
};

const getContrastLayer = (color: string) => {
  return ensureColorContrast2({
    changeable: color,
    unchangeable: color,
    shouldDarkenFn: ({changeable}) => isColorLight(changeable),
    minDistance: 20,
    distanceFn: colorDistanceHsl,
  });
};

type SharableComponentProps = {
  sharablePassage: SharablePassage;
  passageTheme: ThemeType;
  setHeight: (height: number) => void;
  viewShotRef: React.RefObject<ViewShot>;
};

const SharableComponent = (props: SharableComponentProps) => {
  console.log('rendering SharableComponent');

  const {sharablePassage, passageTheme, setHeight, viewShotRef} = props;
  const [localHeight, setLocalHeight] = useState<number>(0);

  const {contentReady} = useScale();

  const onLayout = (event: any) => {
    const {height} = event.nativeEvent.layout;
    setLocalHeight(height);
  };

  useEffect(() => {
    if (contentReady) {
      setHeight(localHeight);
    }
  }, [
    contentReady,
    localHeight,
    sharablePassage &&
      `${getPassageId(sharablePassage.passage)}-${sharablePassage.counter}`,
  ]);

  return (
    <View
      onLayout={onLayout}
      style={{
        ...styles.sharableComponent,
      }}>
      <ViewShot ref={viewShotRef} options={{format: 'png'}}>
        {sharablePassage && (
          <PassageItem
            key={getPassageId(sharablePassage.passage)}
            passage={sharablePassage.passage}
            passageTheme={passageTheme}
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
    flexDirection: 'column',
  },
  passageEditor: {
    alignSelf: 'center',
    borderRadius: 32,
  },
  sharableComponent: {
    alignSelf: 'center',
    minWidth: '90%',
    maxWidth: '90%',
    maxHeight: '90%',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 16,
    borderColor: 'gray',
  },
  themeOption: {
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  selectedIndicator: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: 'white', // or another contrasting color
  },
  shareButtons: {
    marginTop: 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#ffffffa0',
    overflow: 'visible',
    paddingBottom: 200,
  },
});

export default ShareBottomSheet;
