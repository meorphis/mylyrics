import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {
  LyricCardMeasurement,
  LyricCardMeasurementContext,
  LyricCardMeasurementState,
} from '../../../types/measurement';
import {getMeasurementKey, totalNumberOfScales} from './helpers';

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
      measurement.contentHeight = value;

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
  if (
    measurement.contentHeight != null &&
    maxContentHeight != null &&
    measurement.contentHeight > maxContentHeight
  ) {
    if (measurement.scaleIndex < totalNumberOfScales - 1) {
      // the content height and y position are invalid for the new scale size, so
      // do not retain them
      return {
        scaleIndex: measurement.scaleIndex + 1,
        scaleFinalized: false,
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
    } as LyricCardMeasurement;
  }
  return state.measurements[measurementKey];
};

export const {setContentHeight, setMaxContentHeight, setLyricsYPosition} =
  lyricCardMeasurementSlice.actions;

export default lyricCardMeasurementSlice.reducer as Reducer<LyricCardMeasurementState>;
