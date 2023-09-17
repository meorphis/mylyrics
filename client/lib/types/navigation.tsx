import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SongType} from './song';
import ThemeType from './theme';
import {PassageType} from './passage';
import {SelectionOption} from '../components/fullLyrics/FullLyricsScreen';

export type RootStackParamList = {
  Main: undefined;
  PassageItem: {
    passage: PassageType;
    theme: ThemeType;
  };
  FullLyrics: {
    song: SongType;
    theme: ThemeType;
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

export type PassageItemScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'PassageItem'
>;
