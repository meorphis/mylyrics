import React from 'react';
import Carousel from '../../forks/react-native-snap-carousel/src';
import {Dimensions, StyleSheet} from 'react-native';

export const CAROUSEL_MARGIN_TOP = 12;

type Props = {
  data: any[];
  renderItem: ({item, index}: {item: any; index: number}) => JSX.Element;
  keyExtractor: (item: any, index: number) => string;
  firstItem?: number;
  onBeforeSnapToItem?: (slideIndex: number) => void;
};

const PassageItemCarousel = (props: Props) => {
  console.log('rendering PassageItemCarousel');

  const {data, renderItem, keyExtractor, firstItem, onBeforeSnapToItem} = props;

  const [scrollEnabled, setScrollEnabled] = React.useState(true);

  return (
    <Carousel
      containerCustomStyle={styles.carouselContainer}
      slideStyle={styles.slideStyle}
      loop
      loopClonesPerSide={2}
      data={data}
      itemHeight={Dimensions.get('window').height * 0.75}
      sliderHeight={Dimensions.get('window').height * 0.75}
      layout="stack"
      vertical
      activeAnimationType="decay"
      firstItem={firstItem}
      keyExtractor={keyExtractor}
      onBeforeSnapToItem={(slideIndex: number) => {
        // prevent unnecessarily fast scrolling due to performance limitations
        setScrollEnabled(false);
        setTimeout(() => {
          setScrollEnabled(true);
        }, 250);

        if (onBeforeSnapToItem) {
          onBeforeSnapToItem(slideIndex);
        }
      }}
      scrollEnabled={scrollEnabled && data.length > 1}
      renderItem={renderItem}
    />
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginHorizontal: 24,
    marginTop: CAROUSEL_MARGIN_TOP,
  },
  slideStyle: {
    borderRadius: 10,
  },
});

export default PassageItemCarousel;
