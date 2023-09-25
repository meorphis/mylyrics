// a measurement of a lyric card, used for scaling down font size for longer passages
// as well as aligning elements during screen transitions
export type LyricCardMeasurement = {
  contentHeight?: number;
  lyricsYPosition?: number;
  scaleIndex: number;
  scaleFinalized: boolean;
};

// lyric cards are rendered in multiple places in the UI with different layout
// characteristics, so we have to make multiple measurements
export type LyricCardMeasurementContext = 'MAIN_SCREEN' | 'SHARE_BOTTOM_SHEET';

// info for how to render various part of the LyricCard
export type ScaleType = {
  index: number;
  lyricsFontSize: number;
  songNameSize: number;
  artistNameSize: number;
  albumNameSize: number;
  albumImageSize: number;
};

export type LyricCardMeasurementState = {
  measurements: {[key: string]: LyricCardMeasurement};
  maxContentHeight: {[key: string]: number};
};
