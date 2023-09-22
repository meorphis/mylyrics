import React, {useMemo} from 'react';
import {PassageType, ShareablePassage, ThemeSelection} from '../types/passage';
import {getPassageId} from './passage_id';

// *** PUBLIC INTERFACE ***
// should be place near the top of the component tree - allows children to set and get the currently shareable passage
export const ShareablePassageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [shareablePassage, setShareablePassage] =
    React.useState<ShareablePassage | null>(null);

  const value = useMemo(() => {
    return {
      setShareablePassage: (props: {
        passage: PassageType;
        themeSelection?: ThemeSelection;
        textColorSelection?: string;
      }) => {
        setShareablePassage({
          ...getDefaultThemeParamsForPassage(props.passage),
          ...props,
          bottomSheetTriggered: false,
        });
      },
      setBottomSheetTriggered: (triggered: boolean, passage?: PassageType) => {
        setShareablePassage(prev => {
          if (!prev) {
            throw new Error(
              'setBottomSheetTriggered called before setShareablePassage',
            );
          }

          if (triggered === false) {
            return {...prev, bottomSheetTriggered: triggered};
          }

          if (
            passage &&
            (!prev.passage ||
              getPassageId(passage) !== getPassageId(prev.passage))
          ) {
            // slight delay to allow us to actually update the passage before we show it
            setTimeout(() => {
              setShareablePassage(prevInner => ({
                ...prevInner!,
                bottomSheetTriggered: true,
              }));
            }, 250);

            return {
              passage,
              ...getDefaultThemeParamsForPassage(passage),
              bottomSheetTriggered: false,
            };
          } else {
            return {...prev, bottomSheetTriggered: true};
          }
        });
      },
      setThemeSelection: (themeSelection: ThemeSelection) => {
        setShareablePassage(prev => {
          if (!prev) {
            throw new Error(
              'setThemeSelection called before setShareablePassage',
            );
          }

          return {
            ...prev,
            themeSelection,
            textColorSelection:
              getDefaultTextColorForThemeSelection(themeSelection),
          };
        });
      },
      invertThemeSelection: () => {
        setShareablePassage(prev => {
          if (!prev) {
            throw new Error(
              'invertThemeSelection called before setShareablePassage',
            );
          }

          const newThemeSelection = {
            ...prev.themeSelection,
            inverted: !prev.themeSelection.inverted,
          };

          return {
            ...prev,
            themeSelection: newThemeSelection,
            textColorSelection:
              getDefaultTextColorForThemeSelection(newThemeSelection),
          };
        });
      },
      setTextColorSelection: (textColorSelection: string) => {
        setShareablePassage(prev => {
          if (!prev) {
            throw new Error(
              'setTextColorSelection called before setShareablePassage',
            );
          }

          return {
            ...prev,
            textColorSelection,
          };
        });
      },
    };
  }, []);

  return (
    <ShareablePassageUpdateContext.Provider value={value}>
      <ShareablePassageContext.Provider value={shareablePassage}>
        {children}
      </ShareablePassageContext.Provider>
    </ShareablePassageUpdateContext.Provider>
  );
};

const getDefaultThemeParamsForPassage = (passage: PassageType) => {
  return {
    themeSelection: {
      theme: passage.theme,
      inverted: false,
    },
    textColorSelection: passage.theme.textColors[0],
  };
};

const getDefaultTextColorForThemeSelection = (themeSelection: ThemeSelection) =>
  themeSelection.inverted
    ? themeSelection.theme.invertedTheme!.textColors[0]
    : themeSelection.theme.textColors[0];

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
const ShareablePassageUpdateContext = React.createContext<{
  setShareablePassage: (props: {
    passage: PassageType;
    themeSelection?: ThemeSelection;
    textColorSelection?: string;
  }) => void;
  setBottomSheetTriggered: (triggered: boolean, passage?: PassageType) => void;
  setThemeSelection: (themeSelection: ThemeSelection) => void;
  invertThemeSelection: () => void;
  setTextColorSelection: (textColorSelection: string) => void;
}>({
  setShareablePassage: _ => {},
  setBottomSheetTriggered: _ => {},
  setThemeSelection: _ => {},
  invertThemeSelection: () => {},
  setTextColorSelection: _ => {},
});
