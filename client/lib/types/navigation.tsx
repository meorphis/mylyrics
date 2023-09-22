import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {PassageType, ThemeSelection} from './passage';
import {SelectionOption} from '../components/fullLyrics/FullLyricsScreen';

export type RootStackParamList = {
  Main: undefined;
  FullLyrics: {
    originalPassage: PassageType;
    themeSelection?: ThemeSelection;
    textColorSelection?: string;
    sharedTransitionKey: string;
    initiallyHighlightedPassageLyrics: string;
    parentYPosition: number;
    onSelect: SelectionOption;
  };
};

export type FullLyricsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'FullLyrics'
>;
