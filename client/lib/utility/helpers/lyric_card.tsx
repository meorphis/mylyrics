import {Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// returns some layout information for rendering the lyric card, deck,
// and related components
export const useLyricCardSize = () => {
  const windowHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();
  const marginHorizontal = 24;

  // ensures that the items do not get cut off when they are being swiped
  const itemMarginTop = 42;

  // amount of space needed to accommodate elements other than the deck
  const bufferRequired = 170;

  // we don't allow an aspect ratio greater than 3:2 for the deck (ends
  // up being slightly less actually because the items have a top margin)
  const maxDesiredDeckHeight =
    (Dimensions.get('window').width * 3 - 2 * marginHorizontal) / 2;

  // this is the biggest the deck can be without taking up too much space
  const amountOfFreeSpace =
    windowHeight - insets.top - insets.bottom - bufferRequired;
  const deckHeight = Math.min(amountOfFreeSpace, maxDesiredDeckHeight);

  // split the remaining space above and below the deck, with more going
  // to the top
  const deckMarginTop = ((amountOfFreeSpace - deckHeight) * 3) / 4;

  const topCustomTextYOffset = deckMarginTop + (deckMarginTop > 8 ? -4 : 4);
  const bottomCustomTextYOffset = deckHeight + deckMarginTop + 30;

  return {
    deckHeight,
    itemMarginTop,
    deckMarginTop,
    marginHorizontal,
    topCustomTextYOffset,
    bottomCustomTextYOffset,
  };
};
