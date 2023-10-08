import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {
  LyricCardMeasurement,
  LyricCardMeasurementContext,
  LyricCardMeasurementState,
} from '../../../types/measurement';
import {
  getMeasurementKey,
  getScaleForIndex,
  totalNumberOfScales,
} from './helpers';

// allows setting and finalized the layout measurement of a lyric card
export const lyricCardMeasurementSlice = createSlice({
  name: 'lyric_card_measurement',
  initialState: {
    measurements: {},
    maxContentHeight: {},
  } as LyricCardMeasurementState,
  reducers: {
    setContentHeight: (
      state: LyricCardMeasurementState,
      action: PayloadAction<{
        globalPassageKey: string;
        context: LyricCardMeasurementContext;
        value: number;
      }>,
    ) => {
      const {globalPassageKey, context, value} = action.payload;
      const measurement = extractMeasurementFromState({
        state,
        globalPassageKey,
        context,
      });

      // this is a duplicate measurement - do not update
      if (
        measurement.contentHeight![measurement.scaleIndex] != null ||
        (measurement.scaleIndex > 0 &&
          value >= measurement.contentHeight![measurement.scaleIndex - 1])
      ) {
        return;
      }

      measurement.contentHeight!.push(value);

      const withReducedScale = reduceOrFinalizeScale({
        measurement,
        maxContentHeight: state.maxContentHeight[context] ?? null,
      });

      state.measurements[getMeasurementKey({globalPassageKey, context})] =
        withReducedScale;

      return state;
    },
    setMaxContentHeight: (
      state: LyricCardMeasurementState,
      action: PayloadAction<{
        context: LyricCardMeasurementContext;
        value: number;
      }>,
    ) => {
      const {context, value} = action.payload;
      state.maxContentHeight[context] = value;

      Object.keys(state.measurements).forEach(measurementKey => {
        if (!measurementKey.startsWith(context)) {
          return;
        }

        const measurement = state.measurements[measurementKey];
        if (measurement.scaleFinalized) {
          return;
        }
        const withReducedScale = reduceOrFinalizeScale({
          measurement,
          maxContentHeight: value,
        });
        state.measurements[measurementKey] = withReducedScale;
      });
    },
    setLyricsYPosition: (
      state: LyricCardMeasurementState,
      action: PayloadAction<{
        globalPassageKey: string;
        context: LyricCardMeasurementContext;
        value: number;
      }>,
    ) => {
      const {globalPassageKey, context, value} = action.payload;
      const measurement = extractMeasurementFromState({
        state,
        globalPassageKey,
        context,
      });
      measurement.lyricsYPosition = value;
    },
  },
});

const reduceOrFinalizeScale = ({
  measurement,
  maxContentHeight,
}: {
  measurement: LyricCardMeasurement;
  maxContentHeight: number | null;
}): LyricCardMeasurement => {
  const scale = getScaleForIndex(measurement.scaleIndex);

  if (
    measurement.contentHeight != null &&
    maxContentHeight != null &&
    measurement.contentHeight[measurement.scaleIndex] +
      scale.albumImageSize +
      scale.songNameSize >
      maxContentHeight
  ) {
    if (measurement.scaleIndex < totalNumberOfScales - 1) {
      // the y position is invalid for the new scale size, so do not retain it
      return {
        scaleIndex: measurement.scaleIndex + 1,
        scaleFinalized: false,
        contentHeight: measurement.contentHeight,
      };
    } else {
      // unlikely (we'd be using 1pt font at this point), but at this point we
      // just have to render the content with the smallest possible scale no matter
      // how large it is
      return {
        ...measurement,
        scaleFinalized: true,
      };
    }
  } else if (
    maxContentHeight != null &&
    measurement.contentHeight != null &&
    !measurement.scaleFinalized
  ) {
    // we've measured both heights and the content fits, so we can finalize
    return {...measurement, scaleFinalized: true};
  } else {
    // we don't have enough information to finalize the scale
    return measurement;
  }
};

const extractMeasurementFromState = ({
  state,
  globalPassageKey,
  context,
}: {
  state: LyricCardMeasurementState;
  globalPassageKey: string;
  context: LyricCardMeasurementContext;
}): LyricCardMeasurement => {
  const measurementKey = getMeasurementKey({globalPassageKey, context});
  if (!(measurementKey in state.measurements)) {
    state.measurements[measurementKey] = {
      scaleIndex: 0,
      scaleFinalized: false,
      contentHeight: [],
    } as LyricCardMeasurement;
  }
  return state.measurements[measurementKey];
};

export const {setContentHeight, setMaxContentHeight, setLyricsYPosition} =
  lyricCardMeasurementSlice.actions;

export default lyricCardMeasurementSlice.reducer as Reducer<LyricCardMeasurementState>;
