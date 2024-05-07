import {BundleInfo, BundlePassageType} from './bundle';
import {SongType} from './song';
import ThemeType, {ThemeSelection} from './theme';

export type RawPassageTypeType = 'top' | 'artist' | 'sentiment';

// the format that we use to load and save passages to/from the DB; we load the image
// blob, compute the theme, and assign a key on the client side to convert this into a
// PassageType
export type RawPassageType = {
  lyrics: string;
  song: SongType;
  bundleInfos: BundleInfo[];
  type: RawPassageTypeType;
  analysis?: string;
};

// has a theme and a passage key, allowing it to be rendered in a LyricCard
export type PassageType = RawPassageType & {
  theme: ThemeType;
  passageKey: string;
};

// a passage with some optional customization metadata to alter its rendering
export type CustomizablePassageType = {
  passage: BundlePassageType;
  customization: {
    themeSelection: ThemeSelection;
    textColorSelection: string;
  };
};

export type ShareablePassageState = {
  passage: CustomizablePassageType;
  bottomSheetTriggered: boolean;
};
