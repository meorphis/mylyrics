import React, {useRef} from 'react';
import {uuidv4} from '@firebase/util';
import {
  PassageItemProps,
  PassageItemPropsWithoutSharedTransitionKey,
} from './PassageItem';

export const WithSharedTransitionKey = (
  WrappedComponent: React.ComponentType<PassageItemProps>,
) => {
  const SharedTransitionPassageItem = (
    props: PassageItemPropsWithoutSharedTransitionKey,
  ) => {
    const sharedTransitionKey = useRef<string>(uuidv4()).current;

    return (
      <WrappedComponent {...props} sharedTransitionKey={sharedTransitionKey} />
    );
  };

  return SharedTransitionPassageItem;
};
