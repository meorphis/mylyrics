import {RootState} from '..';
import {BundlePassageType} from '../../../types/bundle';
import {
  LyricCardMeasurementContext,
  ScaleType,
} from '../../../types/measurement';

// gets a key to unique identify a lyric card in the context of measurement - we do
// not need to include the bundleId because the same lyric card will have the same
// measurements regardless of which bundle it is a part of
export const getMeasurementKey = ({
  globalPassageKey,
  context,
}: {
  globalPassageKey: string;
  context: LyricCardMeasurementContext;
}) => {
  return `${context}:${globalPassageKey}`;
};

// gets the scale object for a particular index
export const getScaleForIndex = (index: number) => {
  const scale = scales[index];
  if (!scale) {
    throw Error(`no scale defined for index ${index}`);
  }
  return scale;
};

// indicates whether every card passage contained in the deck has a finalized
// scale and a measured y position
export const isDeckFullyMeasured = ({
  state,
  passages,
}: {
  state: RootState;
  passages: BundlePassageType[];
}) => {
  return passages.every(p => {
    const measurementKey = getMeasurementKey({
      globalPassageKey: p.passageKey,
      context: 'MAIN_SCREEN',
    });
    const measurement = state.lyricCardMeasurement.measurements[measurementKey];

    if (
      !(
        measurement &&
        measurement.lyricsYPosition != null &&
        measurement.scaleFinalized
      )
    ) {
      console.log(
        'missing measurement for passage: ' + p.song.name,
        JSON.stringify(measurement, null, 2),
      );
    }

    return (
      measurement &&
      measurement.lyricsYPosition != null &&
      measurement.scaleFinalized
    );
  });
};

const scales: ScaleType[] = [
  {
    index: 0,
    lyricsFontSize: 24,
    songNameSize: 18,
    artistNameSize: 16,
    albumNameSize: 14,
    albumImageSize: 100,
  },
  {
    index: 1,
    lyricsFontSize: 22,
    songNameSize: 18,
    artistNameSize: 16,
    albumNameSize: 14,
    albumImageSize: 100,
  },
  {
    index: 2,
    lyricsFontSize: 20,
    songNameSize: 18,
    artistNameSize: 16,
    albumNameSize: 14,
    albumImageSize: 100,
  },
  {
    index: 3,
    lyricsFontSize: 18,
    songNameSize: 16,
    artistNameSize: 15,
    albumNameSize: 13,
    albumImageSize: 90,
  },
  {
    index: 4,
    lyricsFontSize: 16,
    songNameSize: 15,
    artistNameSize: 13,
    albumNameSize: 13,
    albumImageSize: 80,
  },
  {
    index: 5,
    lyricsFontSize: 14,
    songNameSize: 14,
    artistNameSize: 12,
    albumNameSize: 12,
    albumImageSize: 70,
  },
  {
    index: 6,
    lyricsFontSize: 12,
    songNameSize: 13,
    artistNameSize: 11,
    albumNameSize: 11,
    albumImageSize: 60,
  },
  {
    index: 7,
    lyricsFontSize: 10,
    songNameSize: 12,
    artistNameSize: 10,
    albumNameSize: 10,
    albumImageSize: 50,
  },
  {
    index: 8,
    lyricsFontSize: 8,
    songNameSize: 10,
    artistNameSize: 8,
    albumNameSize: 8,
    albumImageSize: 40,
  },
  {
    index: 9,
    lyricsFontSize: 6,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 10,
    lyricsFontSize: 4,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 11,
    lyricsFontSize: 2,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 12,
    lyricsFontSize: 1,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
];

export const totalNumberOfScales = scales.length;
