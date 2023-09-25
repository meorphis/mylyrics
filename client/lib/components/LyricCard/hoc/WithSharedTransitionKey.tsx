import React, {useRef} from 'react';
import {uuidv4} from '@firebase/util';
import {LyricCardProps} from '../LyricCard';

export type LyricCardPropsWithoutSharedTransitionKey = Omit<
  LyricCardProps,
  'sharedTransitionKey'
>;

export const WithSharedTransitionKey = (
  WrappedComponent: React.ComponentType<LyricCardProps>,
) => {
  const SharedTransitionPassageItem = (
    props: LyricCardPropsWithoutSharedTransitionKey,
  ) => {
    const sharedTransitionKey = useRef<string>(uuidv4()).current;

    return (
      <WrappedComponent {...props} sharedTransitionKey={sharedTransitionKey} />
    );
  };

  return SharedTransitionPassageItem;
};
