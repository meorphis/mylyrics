import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import SongType from './song';
import ThemeType from './theme';
import {PassageType} from './passage';

export type RootStackParamList = {
  Recommendations: undefined;
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
