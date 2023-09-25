import {useSelector} from 'react-redux';
import {RootState} from '..';

// returns whether a prophecy card has been drawn for a particular passage
export const useIsProphecyCardDrawn = ({passageKey}: {passageKey: string}) => {
  return useSelector(
    (state: RootState) =>
      state.prophecy.cards.findIndex(card => card.passageKey === passageKey) !==
      -1,
  );
};

// returns whether a prophecy card can be drawn (for any passage)
export const useCanDrawPhophecyCard = () => {
  return useSelector((state: RootState) => state.prophecy.cards.length < 3);
};

// returns whether a prophecy card can be undrawn (for any passage)
export const useCanUndrawPhophecyCard = () => {
  return useSelector((state: RootState) => state.prophecy.prophecy == null);
};

// returns some information about the drawn prophecy card(s) and computed prophecy
export const useProphecyInfo = () => {
  return useSelector(
    (state: RootState) => state.prophecy,
    (left, right) =>
      left.cards.length === right.cards.length &&
      left.prophecy === right.prophecy,
  );
};
