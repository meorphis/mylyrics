import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
} from 'react';
import {useDispatch} from 'react-redux';
import {addContentReadyPassageId} from './redux/content_ready';

export type ScaleType = {
  index: number;
  lyricsFontSize: number;
  songNameSize: number;
  artistNameSize: number;
  albumNameSize: number;
  albumImageSize: number;
};

const scales = [
  {
    index: 0,
    lyricsFontSize: 20,
    songNameSize: 18,
    artistNameSize: 16,
    albumNameSize: 14,
    albumImageSize: 100,
  },
  {
    index: 1,
    lyricsFontSize: 18,
    songNameSize: 16,
    artistNameSize: 15,
    albumNameSize: 13,
    albumImageSize: 90,
  },
  {
    index: 2,
    lyricsFontSize: 16,
    songNameSize: 15,
    artistNameSize: 13,
    albumNameSize: 13,
    albumImageSize: 80,
  },
  {
    index: 3,
    lyricsFontSize: 14,
    songNameSize: 14,
    artistNameSize: 12,
    albumNameSize: 12,
    albumImageSize: 70,
  },
  {
    index: 4,
    lyricsFontSize: 12,
    songNameSize: 13,
    artistNameSize: 11,
    albumNameSize: 11,
    albumImageSize: 60,
  },
  {
    index: 5,
    lyricsFontSize: 10,
    songNameSize: 12,
    artistNameSize: 10,
    albumNameSize: 10,
    albumImageSize: 50,
  },
  {
    index: 6,
    lyricsFontSize: 8,
    songNameSize: 10,
    artistNameSize: 8,
    albumNameSize: 8,
    albumImageSize: 40,
  },
  {
    index: 7,
    lyricsFontSize: 6,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 8,
    lyricsFontSize: 4,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 9,
    lyricsFontSize: 2,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
  {
    index: 10,
    lyricsFontSize: 1,
    songNameSize: 8,
    artistNameSize: 6,
    albumNameSize: 6,
    albumImageSize: 32,
  },
];

const PassageItemMeasurementContext = createContext<{
  scale: ScaleType;
  scaleFinalized: boolean;
  lyricsYPosition?: number;
}>({
  scale: scales[0],
  scaleFinalized: false,
});

const SetPassageItemMeasurementContext = createContext<{
  setContentHeight: (contentHeight: number) => void;
  setMaxContentHeight: (maxContentHeight: number) => void;
  setLyricsYPosition: (lyricsYPosition: number) => void;
}>({
  setContentHeight: () => {},
  setMaxContentHeight: () => {},
  setLyricsYPosition: () => {},
});

export const usePassageItemMeasurement = () => {
  return useContext(PassageItemMeasurementContext);
};

export const useSetPassageItemMeasurement = () => {
  return useContext(SetPassageItemMeasurementContext);
};

type Measurement = {
  contentHeight?: number;
  maxContentHeight?: number;
  lyricsYPosition?: number;
  scaleIndex: number;
  scaleFinalized: boolean;
};

export const PassageItemMeasurementProvider = ({
  passageId,
  children,
}: {
  passageId: string;
  children: React.ReactNode;
}) => {
  const [measurement, setMeasurement] = useState<Measurement>({
    scaleIndex: 0,
    scaleFinalized: false,
  });

  const dispatch = useDispatch();

  const setContentHeight = (contentHeight: number) => {
    setMeasurement(prevMeasurement => {
      const m = {
        ...prevMeasurement,
        contentHeight,
      };

      return applyUpdates(m);
    });
  };

  const setMaxContentHeight = (maxContentHeight: number) => {
    setMeasurement(prevMeasurement => {
      const m = {
        ...prevMeasurement,
        maxContentHeight,
      };

      return applyUpdates(m);
    });
  };

  const setLyricsYPosition = (lyricsYPosition: number) => {
    setMeasurement(prevMeasurement => {
      const m = {
        ...prevMeasurement,
        lyricsYPosition,
      };

      return applyUpdates(m);
    });
  };

  const applyUpdates = (m: Measurement) => {
    console.log(
      'APPLY UPDATES',
      passageId,
      `scaleFinalized: ${m.scaleFinalized}`,
      `maxContentHeight: ${m?.maxContentHeight}`,
      `contentHeight: ${m?.contentHeight}`,
      `lyricsYPosition: ${m?.lyricsYPosition}`,
    );

    if (
      m?.contentHeight != null &&
      m?.maxContentHeight != null &&
      m.contentHeight > m.maxContentHeight
    ) {
      if (m.scaleIndex < scales.length - 1) {
        // the layout metrics are invalid for the new scale size, so
        // do not retain them
        return {
          scaleIndex: m.scaleIndex + 1,
          scaleFinalized: m.scaleFinalized,
        };
      } else {
        // unlikely, but at this point we just have to render the content
        // with the smallest possible scale no matter how large it is
        return {
          ...m,
          scaleFinalized: true,
        };
      }
    } else if (
      m?.maxContentHeight != null &&
      m?.contentHeight != null &&
      !m.scaleFinalized
    ) {
      return {...m, scaleFinalized: true};
    } else {
      return m;
    }
  };

  useLayoutEffect(() => {
    if (measurement.scaleFinalized && measurement?.lyricsYPosition != null) {
      console.log(
        'CONTENT READY',
        passageId,
        `maxContentHeight: ${measurement?.maxContentHeight}`,
        `contentHeight: ${measurement?.contentHeight}`,
        `lyricsYPosition: ${measurement?.lyricsYPosition}`,
      );
      dispatch(addContentReadyPassageId(passageId));
    }
  }, [measurement.scaleFinalized, measurement?.lyricsYPosition]);

  return (
    <PassageItemMeasurementContext.Provider
      value={{
        scale: scales[measurement.scaleIndex],
        scaleFinalized: measurement.scaleFinalized,
        lyricsYPosition: measurement.lyricsYPosition,
      }}>
      <SetPassageItemMeasurementContext.Provider
        value={{
          setContentHeight,
          setMaxContentHeight,
          setLyricsYPosition,
        }}>
        {children}
      </SetPassageItemMeasurementContext.Provider>
    </PassageItemMeasurementContext.Provider>
  );
};
