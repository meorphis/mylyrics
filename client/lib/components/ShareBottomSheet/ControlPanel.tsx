import React, {memo, useEffect, useLayoutEffect, useState} from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import ThemeType from '../../types/theme';
import ShareButton from './ShareButton';
import Share from 'react-native-share';
import ThemeOptionSelector, {THEME_OPTION_SIZE} from './ThemeOptionSelector';
import {isColorLight} from '../../utility/helpers/color';
import Ionicon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../types/navigation';
import {BOTTOM_SHEET_HANDLE_HEIGHT} from './ShareBottomSheet';
import convert from 'color-convert';
import {useDispatch} from 'react-redux';
import {
  invertThemeSelection,
  setTextColorSelection,
  setTheme,
} from '../../utility/redux/shareable_passage/slice';
import {useShareablePassage} from '../../utility/redux/shareable_passage/selectors';
import {trigger as triggerHapticFeedback} from 'react-native-haptic-feedback';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const CONTROL_PANEL_HEIGHTS = {
  margin_top: 24,
  editor_height: 36 + THEME_OPTION_SIZE * 2,
  editor_margin: 8,
};

type Props = {
  snapPoint: number;
  bottomSheetTriggered: boolean;
  sharedTransitionKey: string;
  viewShotRef: React.RefObject<ViewShot>;
};

// panel that allows customizing the passage to be shared in the bottom sheet
const ControlPanel = (props: Props) => {
  console.log('rendering ControlPanel');

  const {snapPoint, bottomSheetTriggered, sharedTransitionKey, viewShotRef} =
    props;
  const {height: windowHeight} = Dimensions.get('window');
  const safeAreaInsets = useSafeAreaInsets();

  const {
    passage,
    customization: {themeSelection, textColorSelection},
  } = useShareablePassage()!;
  const dispatch = useDispatch();

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // THEME SELECTION: we default to the selected passage's theme and that theme's first text color,
  // but we allow the user to change both
  const defaultTheme = passage.theme;

  const {theme: baseSelectedTheme, inverted} = themeSelection;

  const selectedTheme = inverted
    ? baseSelectedTheme.invertedTheme!
    : baseSelectedTheme;

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

  // RESET STATE: when the passage changes or the bottom sheet is re-opened, we reset the
  // edit mode to false
  useEffect(() => {
    setEditThemeMode(false);
  }, [passage.passageKey, bottomSheetTriggered]);

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
                  customizablePassage: {
                    passage,
                    customization: {
                      themeSelection,
                      textColorSelection,
                    },
                  },
                  lyricCardMeasurementContext: 'SHARE_BOTTOM_SHEET',
                  lyricsYPositionOffset:
                    windowHeight -
                    snapPoint +
                    BOTTOM_SHEET_HANDLE_HEIGHT -
                    safeAreaInsets.top,
                  sharedTransitionKey,
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
              triggerHapticFeedback('impactLight');
              setEditThemeMode(false);
            }}
            style={styles.closePaletteEditorButton}>
            <Ionicon name="close-circle-outline" size={28} />
          </TouchableOpacity>
          <ThemeOptionSelector<ThemeType>
            key="background-color-selector"
            icon="format-paint"
            options={[defaultTheme, ...defaultTheme.alternateThemes]}
            setSelected={option => dispatch(setTheme(option))}
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
            invert={() => dispatch(invertThemeSelection())}
          />
          <ThemeOptionSelector<string>
            key="text-color-selector"
            icon="text-fields"
            options={selectedTheme.textColors}
            setSelected={option => dispatch(setTextColorSelection(option))}
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
  const [L, a, b] = convert.hex.lab(farBackgroundColor);

  if (L <= 90) {
    return `#${convert.lab.hex([Math.max(95, L + 5), a * 0.5, b * 0.5])}`;
  } else {
    if (Math.abs(a) > 50 || Math.abs(b) > 50) {
      return `#${convert.lab.hex([L, a * 0.5, b * 0.5])}`;
    }
    return `#${convert.lab.hex([L - 10, a, b])}`;
  }
};

const EditorButton = (props: {
  onPress: () => void;
  IconClass: React.ComponentType<any>;
  iconName: string;
  text: string;
}) => {
  const {onPress, IconClass, iconName, text} = props;

  return (
    <TouchableOpacity
      onPress={() => {
        triggerHapticFeedback('impactLight');
        onPress();
      }}
      style={styles.editorButton}>
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
    borderColor: '#00000040',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    width: 144,
    justifyContent: 'center',
  },
  themeEditor: {
    borderWidth: 3,
    borderColor: '#00000040',
    borderRadius: 16,
    backgroundColor: '#f2f2f240',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,

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

export default memo(ControlPanel);
