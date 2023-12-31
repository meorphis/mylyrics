import {useSelector} from 'react-redux';
import {RootState} from '..';
import {LyricCardMeasurementContext} from '../../../types/measurement';
import {getMeasurementKey, getScaleForIndex} from './helpers';

// returns the scale to use to render a particular lyric card in a particular context,
// along with a boolean indicating whether it is finalized
export const useScaleInfo = ({
  globalPassageKey,
  context,
}: {
  globalPassageKey: string;
  context: LyricCardMeasurementContext;
}) => {
  const measurementKey = getMeasurementKey({
    globalPassageKey,
    context,
  });
  return useSelector(
    (state: RootState) => {
      const measurement = state.lyricCardMeasurement.measurements[
        measurementKey
      ] ?? {
        scaleIndex: 0,
        scaleFinalized: false,
      };
      return {
        scale: getScaleForIndex(measurement.scaleIndex),
        scaleFinalized: measurement.scaleFinalized,
      };
    },
    (prev, next) =>
      prev.scale.index === next.scale.index &&
      prev.scaleFinalized === next.scaleFinalized,
  );
};

// returns the y position of the top of lyrics rendered in a lyric card
export const useLyricsYPosition = ({
  globalPassageKey,
  context,
}: {
  globalPassageKey: string;
  context: LyricCardMeasurementContext;
}) => {
  const measurementKey = getMeasurementKey({
    globalPassageKey,
    context,
  });
  return useSelector((state: RootState) => {
    const measurement = state.lyricCardMeasurement.measurements[measurementKey];
    return measurement.lyricsYPosition;
  });
};
