import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CustomizablePassageType} from './passage';
import {LyricCardMeasurementContext} from './measurement';
import {FullLyricsSelectionOption} from './full_lyrics';

// pages the user can navigate to in the UI and the necessary parameters for each
export type RootStackParamList = {
  Main: undefined;
  FullLyrics: {
    customizablePassage: CustomizablePassageType;
    lyricCardMeasurementContext: LyricCardMeasurementContext;
    lyricsYPositionOffset: number;
    sharedTransitionKey: string;
    onSelect: FullLyricsSelectionOption;
  };
};

export type FullLyricsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'FullLyrics'
>;
