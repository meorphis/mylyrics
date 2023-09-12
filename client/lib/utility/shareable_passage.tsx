import React, {useCallback} from 'react';
import {PassageType} from '../types/passage';

export type SharablePassage = {
  passage: PassageType;
  counter: number;
};

// *** PUBLIC INTERFACE ***
// should be place near the top of the component tree - allows children to set and get the currently sharable passage
export const SharablePassageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sharablePassage, setSharablePassage] =
    React.useState<SharablePassage | null>(null);

  const setSharablePassageCallback = useCallback(
    (passage: PassageType) => {
      setSharablePassage(v => {
        return {
          counter: v?.counter ? v.counter + 1 : 1,
          passage: passage,
        };
      });
    },
    [setSharablePassage],
  );

  return (
    <SharablePassageUpdateContext.Provider value={setSharablePassageCallback}>
      <SharablePassageContext.Provider value={sharablePassage}>
        {children}
      </SharablePassageContext.Provider>
    </SharablePassageUpdateContext.Provider>
  );
};

export const useSharablePassage = () => {
  const context = React.useContext(SharablePassageContext);

  if (context === undefined) {
    throw new Error(
      'useSharablePassage must be used within a SharablePassageProvider',
    );
  }

  return context;
};

export const useSharablePassageUpdate = () => {
  const context = React.useContext(SharablePassageUpdateContext);

  if (context === undefined) {
    throw new Error(
      'useSharablePassageUpdate must be used within a SharablePassageProvider',
    );
  }

  return context;
};

const SharablePassageContext = React.createContext<SharablePassage | null>(
  null,
);
const SharablePassageUpdateContext = React.createContext<
  (passage: PassageType) => void
>(_ => {});
