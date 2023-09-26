import React from 'react';
import {SharedValue, useSharedValue} from 'react-native-reanimated';

// a provider component that stores SharedValues that are used in disparate parts
// of the component tree and cannot be easily threaded through props
export const CommonSharedValuesProvider = (props: {
  children: JSX.Element | JSX.Element[];
}) => {
  const sharedDeckProgress = useSharedValue(0);
  const sharedDecksCarouselProgress = useSharedValue(0);

  return (
    <CommonSharedValuesContext.Provider
      value={{sharedDeckProgress, sharedDecksCarouselProgress}}>
      {props.children}
    </CommonSharedValuesContext.Provider>
  );
};

// a hook that returns the shared values
export const useCommonSharedValues = () => {
  const values = React.useContext(CommonSharedValuesContext)!;
  // assume it's not null because we'll only ever use this inside of a provider
  return values!;
};

const CommonSharedValuesContext = React.createContext<{
  sharedDeckProgress: SharedValue<number>;
  sharedDecksCarouselProgress: SharedValue<number>;
} | null>(null);
