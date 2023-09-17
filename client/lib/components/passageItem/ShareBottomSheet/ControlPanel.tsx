import React, {memo, useEffect, useLayoutEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import tinycolor from 'tinycolor2';
import ThemeType from '../../../types/theme';
import ShareButton from '../ShareButton';
import Share from 'react-native-share';
import ThemeOptionSelector from './ThemeOptionSelector';
import {isColorLight} from '../../../utility/color';
import Ionicon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../../types/navigation';
import {useShareablePassageUpdate} from '../../../utility/shareable_passage';
import {getPassageId} from '../../../utility/passage_id';
import {PassageType} from '../../../types/passage';

export const CONTROL_PANEL_HEIGHTS = {
  margin_top: 24,
  editor_height: 108,
  editor_margin: 8,
};

type Props = {
  passage: PassageType;
  sharedTransitionKey: string;
  viewShotRef: React.RefObject<ViewShot>;
};

const ControlPanel = (props: Props) => {
  console.log('rendering ControlPanel');

  const {passage, sharedTransitionKey, viewShotRef} = props;
  const {setShareablePassage} = useShareablePassageUpdate();

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // THEME SELECTION: we default to the selected passage's theme and that theme's first text color,
  // but we allow the user to change both
  const defaultTheme = passage.theme;

  const [themeSelection, setThemeSelection] = useState<{
    theme: ThemeType;
    inverted: boolean;
  }>({
    theme: defaultTheme,
    inverted: false,
  });

  const {theme: baseSelectedTheme, inverted} = themeSelection;

  const selectedTheme = inverted
    ? baseSelectedTheme.invertedTheme!
    : baseSelectedTheme;

  const [textColorSelection, setTextColorSelection] = useState<string>(
    defaultTheme.textColors[0],
  );

  // reset the text color when the theme changes
  useLayoutEffect(() => {
    setTextColorSelection(selectedTheme.textColors[0]);
  }, [selectedTheme]);

  // update the parent's theme when the theme changes
  useLayoutEffect(() => {
    setShareablePassage({
      ...passage,
      theme: {
        ...selectedTheme,
        textColors: [textColorSelection],
      },
    });
  }, [selectedTheme, textColorSelection]);

  // EDIT MODE: to save space on the screen, we do not show the theme editor by default; if the
  // user toggles it on, we fade the editor main menu out and the theme editor in
  const [editThemeMode, setEditThemeMode] = useState<boolean>(false);

  const editThemeModeAnim = useSharedValue(0);

  useLayoutEffect(() => {
    if (editThemeMode) {
      editThemeModeAnim.value = withTiming(1, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      editThemeModeAnim.value = withTiming(0, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [editThemeMode]);

  const editorMenuOpacity = useAnimatedStyle(() => {
    return {
      opacity: 1 - editThemeModeAnim.value,
      zIndex: editThemeMode ? -1 : 1,
    };
  });

  const themeEditorOpacity = useAnimatedStyle(() => {
    return {
      opacity: editThemeModeAnim.value,
      zIndex: editThemeMode ? 1 : -1,
    };
  });

  // RESET STATE: when the shareable passage changes, we reset the theme to that passage's theme
  // and close edit mode
  useEffect(() => {
    setThemeSelection({theme: defaultTheme, inverted: false});
    setEditThemeMode(false);
  }, [getPassageId(passage)]);

  return (
    <View
      style={{
        ...styles.controlPanel,
        backgroundColor: controlPanelColor(selectedTheme.farBackgroundColor),
      }}>
      <View style={styles.editor}>
        <Animated.View style={[styles.editorMenu, editorMenuOpacity]}>
          <View style={styles.shareButtons}>
            <ShareButton
              shareType={Share.Social.INSTAGRAM_STORIES}
              backgroundColor={selectedTheme.farBackgroundColor}
              viewShotRef={viewShotRef}
            />
            <ShareButton
              shareType={'other'}
              backgroundColor={selectedTheme.farBackgroundColor}
              viewShotRef={viewShotRef}
            />
          </View>
          <View style={styles.editorButtons}>
            <EditorButton
              onPress={() => {
                setEditThemeMode(true);
              }}
              IconClass={Ionicon}
              iconName="color-palette"
              text="edit colors"
            />
            <EditorButton
              onPress={() => {
                navigation.navigate('FullLyrics', {
                  theme: selectedTheme,
                  song: passage.song,
                  sharedTransitionKey,
                  initiallyHighlightedPassageLyrics: passage.lyrics,
                  parentYPosition: 0,
                  onSelect: 'UPDATE_SHAREABLE',
                });
              }}
              IconClass={MaterialIcon}
              iconName="expand"
              text="change lyrics"
            />
          </View>
        </Animated.View>
        <Animated.View style={[styles.themeEditor, themeEditorOpacity]}>
          <TouchableOpacity
            onPress={() => {
              setEditThemeMode(false);
            }}
            style={styles.closePaletteEditorButton}>
            <Ionicon name="close-circle-outline" size={28} />
          </TouchableOpacity>
          <ThemeOptionSelector<ThemeType>
            key="background-color-selector"
            icon="format-paint"
            options={[defaultTheme, ...defaultTheme.alternateThemes]}
            setSelected={option =>
              setThemeSelection({
                theme: option,
                inverted: false,
              })
            }
            optionIsSelected={t =>
              t.backgroundColor === baseSelectedTheme.backgroundColor
            }
            optionToColor={(t, isSelected) => {
              return isSelected && inverted
                ? t.invertedTheme!.backgroundColor
                : t.backgroundColor;
            }}
            optionToSelectionColor={option => {
              return isColorLight(option.backgroundColor)
                ? '#00000040'
                : '#ffffff40';
            }}
            selectedBackgroundColor={selectedTheme.backgroundColor}
            selectedFarBackgroundColor={selectedTheme.farBackgroundColor}
            invert={() => {
              setThemeSelection(s => {
                return {
                  theme: s.theme,
                  inverted: !s.inverted,
                };
              });
            }}
          />
          <ThemeOptionSelector<string>
            key="text-color-selector"
            icon="text-fields"
            options={selectedTheme.textColors}
            setSelected={option => setTextColorSelection(option)}
            optionIsSelected={t => textColorSelection === t}
            optionToColor={t => t}
            optionToSelectionColor={option => {
              return isColorLight(option) ? '#00000040' : '#ffffff40';
            }}
            selectedBackgroundColor={selectedTheme.backgroundColor}
            selectedFarBackgroundColor={selectedTheme.farBackgroundColor}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const controlPanelColor = (farBackgroundColor: string) => {
  const farBackgroundColorHsl = tinycolor(farBackgroundColor).toHsl();

  let newL;

  if (farBackgroundColorHsl.l < 0.7 || farBackgroundColorHsl.s > 0.4) {
    newL = Math.max(0.8, farBackgroundColorHsl.l);
  } else if (farBackgroundColorHsl.l < 0.9) {
    newL = farBackgroundColorHsl.l + 0.1;
  } else {
    newL = farBackgroundColorHsl.l - 0.1;
  }

  return tinycolor({
    ...farBackgroundColorHsl,
    l: newL,
  }).toHexString();
};

const EditorButton = (props: {
  onPress: () => void;
  IconClass: React.ComponentType<any>;
  iconName: string;
  text: string;
}) => {
  const {onPress, IconClass, iconName, text} = props;

  return (
    <TouchableOpacity onPress={onPress} style={styles.editorButton}>
      <IconClass name={iconName} size={24} />
      <Text style={styles.editorButtonText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  controlPanel: {
    marginTop: CONTROL_PANEL_HEIGHTS.margin_top,
    paddingBottom: 200,
  },
  editor: {
    height: CONTROL_PANEL_HEIGHTS.editor_height,
    margin: CONTROL_PANEL_HEIGHTS.editor_margin,
  },
  editorMenu: {
    flexDirection: 'row',
    height: '100%',
    paddingHorizontal: 8,
  },
  editorButtons: {
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    flex: 1,
  },
  editorButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffffb0',
    alignItems: 'center',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffffff40',
    shadowColor: '#000', // Adds shadow for iOS
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8, // Adds shadow for Android
    width: 144,
    justifyContent: 'center',
  },
  themeEditor: {
    borderWidth: 3,
    borderColor: '#ffffff40',
    borderRadius: 16,
    backgroundColor: '#f2f2f240', // Adds a subtle background color
    shadowColor: '#000', // Adds shadow for iOS
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8, // Adds shadow for Android

    padding: 12,
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  closePaletteEditorButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },

  editorButtonText: {
    fontSize: 16,
    marginLeft: 4,
  },
});

export default memo(
  ControlPanel,
  (prevProps, nextProps) =>
    getPassageId(prevProps.passage) === getPassageId(nextProps.passage),
);
