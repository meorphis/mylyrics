import {RawSongType, SongType} from './song';
import ThemeType, {ThemeSelection} from './theme';

// the format that we use to load and save passages to/from the DB; we load the image
// blob, compute the theme, and assign a key on the client side to convert this into a
// PassageType
export type RawPassageType = {
  lyrics: string;
  song: RawSongType;
  bundleKeys: string[];
};

// contains a single passage of lyrics with metadata, providing enough info to be
// rendered in a LyricCard component
export type PassageType = {
  lyrics: string;
  song: SongType;
  theme: ThemeType;
  passageKey: string;
};

// a passage with some optional customization metadata to alter its rendering
export type CustomizablePassageType = {
  passage: PassageType;
  customization: {
    themeSelection: ThemeSelection;
    textColorSelection: string;
  };
};

export type ShareablePassageState = {
  passage: CustomizablePassageType;
  bottomSheetTriggered: boolean;
};
