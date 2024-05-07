import {useSelector} from 'react-redux';
import {RootState} from '..';
import {getIsFlippedKey} from './util';

export const useShouldAutoFlip = ({
  bundleKey,
  passageKey,
}: {
  bundleKey: string;
  passageKey: string;
}) => {
  return useSelector((state: RootState) => {
    return (
      state.cardFlip.should_autoflip &&
      state.bundles.activeBundleKey === bundleKey &&
      state.bundles.bundleKeyToPassageKey[bundleKey] === passageKey
    );
  });
};

export const useIsFlipped = ({
  bundleKey,
  passageKey,
}: {
  bundleKey: string;
  passageKey: string;
}) => {
  const key = getIsFlippedKey({bundleKey, passageKey});
  return useSelector((state: RootState) => state.cardFlip.is_flipped[key]);
};
