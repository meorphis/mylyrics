import React, {useRef} from 'react';
import {uuidv4} from '@firebase/util';
import PassageItem, {
  PassageItemProps,
  PassageItemPropsWithoutSharedTransitionKey,
} from './PassageItem';

const WithSharedTransitionKey = (
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

export default WithSharedTransitionKey(PassageItem);
