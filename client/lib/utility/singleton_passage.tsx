import React from 'react';
import {PassageType} from '../types/passage';
import {useSetActiveGroup} from './active_passage';

type SingletonPassage = {
  passage: PassageType;
  previousGroupKey: string;
};

// *** PUBLIC INTERFACE ***
// should be place near the top of the component tree - allows children to set and get the current singleton passage
export const SingletonPassageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [singletonPassage, setSingletonPassageState] =
    React.useState<SingletonPassage | null>(null);

  const setAsActiveGroup = useSetActiveGroup({groupKey: 'singleton_passage'});

  return (
    <SingletonPassageUpdateContext.Provider
      value={{
        setSingletonPassage: (sp: SingletonPassage) => {
          setSingletonPassageState(sp);
          setAsActiveGroup();
        },
        unsetSingletonPassage: () => {
          setSingletonPassageState(null);
        },
      }}>
      <SingletonPassageContext.Provider value={singletonPassage}>
        {children}
      </SingletonPassageContext.Provider>
    </SingletonPassageUpdateContext.Provider>
  );
};

export const useSingletonPassage = () => {
  const context = React.useContext(SingletonPassageContext);
  return context;
};

export const useSingletonPassageUpdate = () => {
  const context = React.useContext(SingletonPassageUpdateContext);
  return context;
};

const SingletonPassageContext = React.createContext<SingletonPassage | null>(
  null,
);
const SingletonPassageUpdateContext = React.createContext<{
  setSingletonPassage: (sp: SingletonPassage) => void;
  unsetSingletonPassage: () => void;
}>({
  setSingletonPassage: _ => {},
  unsetSingletonPassage: () => {},
});
