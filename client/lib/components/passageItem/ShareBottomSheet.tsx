import {useCallback, useEffect, useRef, useState} from 'react';
import ViewShot from 'react-native-view-shot';
import {addColorOpacity} from '../../utility/color';
import Share from 'react-native-share';
import React from 'react';
import tinycolor from 'tinycolor2';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {Image, StyleSheet, View} from 'react-native';
import {useTheme} from '../../utility/theme';
import {
  SharablePassage,
  useSharablePassage,
} from '../../utility/shareable_passage';
import {getPassageId} from '../../utility/passage_id';
import PassageItem from './PassageItem';
import ThemeType from '../../types/theme';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {getFurthestColor} from '../../utility/lyrics';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ScaleProvider, useScale} from '../../utility/max_size';
import IconButton from '../common/IconButton';

const ShareBottomSheet = () => {
  console.log('rendering ShareBottomSheet');

  const bottomSheetRef = useRef<BottomSheet>(null);

  const sharablePassage = useSharablePassage();

  // useEffect(() => {
  //   if (sharablePassage != null) {
  //     bottomSheetRef.current?.expand();
  //   }
  // }, [
  //   sharablePassage &&
  //     `${getPassageId(sharablePassage.passage)}-${sharablePassage.counter}`,
  // ]);

  const defaultTheme = useTheme();

  const [passageTheme, setPassageTheme] = useState<ThemeType>(defaultTheme);

  useEffect(() => {
    setPassageTheme(defaultTheme);
  }, [defaultTheme]);

  const altThemes = [
    defaultTheme.primaryColor,
    defaultTheme.secondaryColor,
    defaultTheme.detailColor,
  ].map(color => {
    const contrastColor = getFurthestColor({
      subject: color,
      options: [
        defaultTheme.primaryColor,
        defaultTheme.secondaryColor,
        defaultTheme.detailColor,
        defaultTheme.backgroundColor,
      ],
      ensureContrast: true,
    });

    return {
      backgroundColor: color,
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

  const setHeight = useCallback(
    (height: number) => {
      const newSnapPoint = Math.min(height + 200, 800);
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

  const insets = useSafeAreaInsets();

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[snapPoint]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      containerStyle={{...styles.container, paddingBottom: insets.bottom}}>
      <View style={styles.passageEditor}>
        {sharablePassage && (
          <ScaleProvider
            key={getPassageId(sharablePassage.passage)}
            maxSize={500}>
            <SharableComponent
              sharablePassage={sharablePassage}
              passageTheme={passageTheme}
              setHeight={setHeight}
              viewShotRef={viewShotRef}
            />
          </ScaleProvider>
        )}
        <View style={styles.themeOptions}>
          {[defaultTheme, ...altThemes].map((theme, index) => (
            <TouchableOpacity
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                ...styles.themeOption,
                backgroundColor: theme.backgroundColor,
                borderWidth:
                  tinycolor(theme.backgroundColor).getLuminance() > 0.8 ? 1 : 0,
              }}
              key={index}
              onPress={() => setPassageTheme(theme)}>
              {theme.backgroundColor === passageTheme.backgroundColor && (
                <View
                  style={{
                    ...styles.selectedIndicator,
                    backgroundColor: theme.primaryColor,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.shareButtons}>
        <IconButton
          style={styles.instaButton}
          onPress={() => {
            if (viewShotRef.current && viewShotRef.current.capture) {
              viewShotRef.current.capture().then(res => {
                // https://developers.facebook.com/docs/instagram/sharing-to-stories/#sharing-to-stories
                const shareOptions = {
                  stickerImage: res,
                  backgroundBottomColor: tinycolor(
                    addColorOpacity(passageTheme.backgroundColor, 0.5),
                  ).toHexString(),
                  backgroundTopColor: tinycolor(
                    addColorOpacity(passageTheme.backgroundColor, 0.5),
                  ).toHexString(),
                  // attributionURL: 'http://deep-link-to-app', //in beta
                  social: Share.Social.INSTAGRAM_STORIES as any,
                  appId: '279012348258138',
                };

                Share.shareSingle(shareOptions);
              });
            }
          }}
          icon={
            <Image
              source={require('../../assets/insta_icon.png')}
              style={styles.instaIcon}
            />
          }
        />
      </View>
    </BottomSheet>
  );
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
          />
        )}
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  passageEditor: {
    alignSelf: 'center',
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
    marginTop: 12,
    borderColor: 'gray',
  },
  themeOption: {
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: 'white', // or another contrasting color
  },
  shareButtons: {
    backgroundColor: 'lightgrey',
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    bottom: 32,
    left: 32,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 8,
  },
  instaIcon: {
    width: 40,
    height: 40,
  },
  instaButton: {
    flexDirection: 'column',
  },
  instaButtonText: {
    color: 'black',
  },
});

export default ShareBottomSheet;
