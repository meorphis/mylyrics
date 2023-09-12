import React, {createContext, useContext, useState, useEffect} from 'react';

export type ScaleType = {
  lyricsFontSize: number;
  songNameSize: number;
  artistNameSize: number;
  albumNameSize: number;
  albumImageSize: number;
  contentReady: boolean;
};

export const Scale = [
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

const ScaleContext = createContext<{
  scaleIndex: number;
  contentReady: boolean;
}>({
  scaleIndex: 0,
  contentReady: false,
});

const SetContentHeightContext = createContext<{
  setContentHeightForScale: ({
    height,
    scaleIndex,
  }: {
    height: number;
    scaleIndex: number;
  }) => void;
}>({
  setContentHeightForScale: () => {},
});

export const useScale = () => {
  const {scaleIndex, contentReady} = useContext(ScaleContext);
  return {
    contentReady,
    ...Scale[scaleIndex],
  };
};

export const useSetContentHeightForScale = () => {
  const {setContentHeightForScale} = useContext(SetContentHeightContext);
  return setContentHeightForScale;
};

export const ScaleProvider = ({
  children,
  maxSize,
}: {
  children: React.ReactNode;
  maxSize: number | null;
}) => {
  const [scaleIndex, setScaleIndex] = useState<number>(0);
  const [contentReady, setContentReady] = useState<boolean>(false);
  const [contentHeightForScale, setContentHeightForScale] = useState<{
    height: number;
    scaleIndex: number;
  } | null>(null);

  useEffect(() => {
    console.log('contentHeight', contentHeightForScale?.height);
    console.log('maxSize', maxSize);

    if (
      maxSize &&
      contentHeightForScale &&
      contentHeightForScale.height > maxSize
    ) {
      if (
        contentHeightForScale.scaleIndex === scaleIndex &&
        scaleIndex < Scale.length - 1
      ) {
        console.log('decreasing scale');
        setScaleIndex(scaleIndex + 1);
      }
    } else if (maxSize && contentHeightForScale && !contentReady) {
      setContentReady(true);
    }
  }, [contentHeightForScale?.height, maxSize]);

  return (
    <ScaleContext.Provider value={{scaleIndex, contentReady}}>
      <SetContentHeightContext.Provider value={{setContentHeightForScale}}>
        {children}
      </SetContentHeightContext.Provider>
    </ScaleContext.Provider>
  );
};
