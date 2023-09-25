import {Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// returns some layout information for rendering the lyric card
export const useLyricCardSize = () => {
  const windowHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();
  const buffer = 150;
  const maxHeight = windowHeight - insets.top - insets.bottom - buffer;
  const height = Math.min(maxHeight, 520);
  const carouselClearance = 42;
  const marginTop = Math.max(0, (maxHeight - height) / 2 + carouselClearance);
  const marginHorizontal = 24;

  return {
    height,
    marginTop,
    marginHorizontal,
    carouselClearance,
  };
};
