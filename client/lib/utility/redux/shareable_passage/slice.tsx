import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {PassageType, ShareablePassageState} from '../../../types/passage';
import ThemeType from '../../../types/theme';
import {setActiveBundlePassage} from '../bundles/slice';
import {
  getDefaultCustomizationForPassage,
  getDefaultTextColorForThemeSelection,
} from '../../helpers/theme';
import {getPassageId} from '../../helpers/passage';
import {BundlePassageType} from '../../../types/bundle';

// allows setting and modifying the customization of a passage that can be shared
// externally from the app
export const shareablePassagetSlice = createSlice({
  name: 'shareable_passage',
  initialState: {} as ShareablePassageState,
  reducers: {
    setBottomSheetTriggered: (
      state: ShareablePassageState,
      action: PayloadAction<boolean>,
    ) => {
      state.bottomSheetTriggered = action.payload;
    },
    setTheme: (
      state: ShareablePassageState,
      action: PayloadAction<ThemeType>,
    ) => {
      const themeSelection = {
        theme: action.payload,
        inverted: false,
      };

      state.passage.customization = {
        themeSelection,
        textColorSelection:
          getDefaultTextColorForThemeSelection(themeSelection),
      };
    },
    invertThemeSelection: (state: ShareablePassageState) => {
      const customization = state.passage.customization;
      const newThemeSelection = {
        ...customization.themeSelection,
        inverted: !customization.themeSelection.inverted,
      };
      state.passage.customization = {
        themeSelection: newThemeSelection,
        textColorSelection:
          getDefaultTextColorForThemeSelection(newThemeSelection),
      };
    },
    setTextColorSelection: (
      state: ShareablePassageState,
      action: PayloadAction<string>,
    ) => {
      state.passage.customization.textColorSelection = action.payload;
    },
    setLyrics: (
      state: ShareablePassageState,
      action: PayloadAction<string>,
    ) => {
      state.passage.passage.lyrics = action.payload;
      state.passage.passage.passageKey = getPassageId(state.passage.passage);
    },
  },
  extraReducers: builder => {
    builder.addCase(setActiveBundlePassage, (state, action) => {
      const passage = {
        ...action.payload.bundlePassage,
      } as BundlePassageType;

      state.passage = {
        passage,
        customization: getDefaultCustomizationForPassage(
          passage as PassageType,
        ),
      };
    });
  },
});

export const {
  setBottomSheetTriggered,
  setTheme,
  invertThemeSelection,
  setTextColorSelection,
  setLyrics,
} = shareablePassagetSlice.actions;

export default shareablePassagetSlice.reducer as Reducer<ShareablePassageState>;
