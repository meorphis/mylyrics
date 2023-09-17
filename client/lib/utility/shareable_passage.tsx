import React, {useMemo} from 'react';
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
    React.useState<PassageType | null>(null);

  const [bottomSheetTriggered, setBottomSheetTriggered] = React.useState(false);

  const value = useMemo(() => {
    return {
      setShareablePassage: (passage: PassageType) => {
        setShareablePassage(passage);
      },
      setBottomSheetTriggered: (triggered: boolean) => {
        setBottomSheetTriggered(triggered);
      },
    };
  }, []);

  return (
    <ShareablePassageUpdateContext.Provider value={value}>
      <ShareablePassageContext.Provider
        value={{
          passage: shareablePassage,
          bottomSheetTriggered,
        }}>
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

const ShareablePassageContext = React.createContext<{
  passage: PassageType | null;
  bottomSheetTriggered: boolean;
}>({
  passage: null,
  bottomSheetTriggered: false,
});
const ShareablePassageUpdateContext = React.createContext<{
  setShareablePassage: (passage: PassageType) => void;
  setBottomSheetTriggered: (triggered: boolean) => void;
}>({setShareablePassage: _ => {}, setBottomSheetTriggered: () => {}});
