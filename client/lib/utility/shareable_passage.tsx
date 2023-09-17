import React, {useCallback} from 'react';
import {PassageType} from '../types/passage';

export type ShareablePassage = {
  passage: PassageType;
  counter: number;
};

// *** PUBLIC INTERFACE ***
// should be place near the top of the component tree - allows children to set and get the currently shareable passage
export const ShareablePassageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [shareablePassage, setShareablePassage] =
    React.useState<ShareablePassage | null>(null);

  const setShareablePassageCallback = useCallback(
    (passage: PassageType) => {
      setShareablePassage(v => {
        return {
          counter: v?.counter ? v.counter + 1 : 1,
          passage: passage,
        };
      });
    },
    [setShareablePassage],
  );

  return (
    <ShareablePassageUpdateContext.Provider value={setShareablePassageCallback}>
      <ShareablePassageContext.Provider value={shareablePassage}>
        {children}
      </ShareablePassageContext.Provider>
    </ShareablePassageUpdateContext.Provider>
  );
};

export const useShareablePassage = () => {
  const context = React.useContext(ShareablePassageContext);

  if (context === undefined) {
    throw new Error(
      'useShareablePassage must be used within a ShareablePassageProvider',
    );
  }

  return context;
};

export const useShareablePassageUpdate = () => {
  const context = React.useContext(ShareablePassageUpdateContext);

  if (context === undefined) {
    throw new Error(
      'useShareablePassageUpdate must be used within a ShareablePassageProvider',
    );
  }

  return context;
};

const ShareablePassageContext = React.createContext<ShareablePassage | null>(
  null,
);
const ShareablePassageUpdateContext = React.createContext<
  (passage: PassageType) => void
>(_ => {});
