import React, {memo} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import Carousel from '../../forks/react-native-reanimated-carousel/src';

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
  const [index, setIndex] = React.useState<number>(0);

  const [scrollEnabled, setScrollEnabled] = React.useState(true);

  return (
    <View style={{flex: 1, height: '80%'}}>
      <Carousel
        style={styles.carouselContainer}
        // slideStyle={styles.slideStyle}
        loop
        // loopClonesPerSide={0}
        data={data}
        // itemHeight={Dimensions.get('window').height * 0.75}
        // sliderHeight={Dimensions.get('window').height * 0.75}
        height={Dimensions.get('window').height * 0.75}
        width={Dimensions.get('window').width - 48}
        // layout="stack"
        vertical
        mode="vertical-stack"
        modeConfig={{
          stackInterval: 30,
          scaleInterval: 0.04,
          opacityInterval: 0.3,
          rotateZDeg: 90,
          moveSize: Dimensions.get('window').width * 1.5,
        }}
        // activeAnimationType="decay"
        // firstItem={firstItem}
        // keyExtractor={keyExtractor}
        // onBeforeSnapToItem={(slideIndex: number) => {
        onBeforeSnapToItem={(slideIndex: number) => {
          console.log('SLIDE INDEX', slideIndex);
          // prevent unnecessarily fast scrolling due to performance limitations
          setScrollEnabled(false);
          setTimeout(() => {
            setScrollEnabled(true);
          }, 250);

          if (onBeforeSnapToItem) {
            onBeforeSnapToItem(slideIndex);
          }
        }}
        // enabled={scrollEnabled && data.length > 1}
        renderItem={renderItem}
        snapEnabled
        // pagingEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginTop: CAROUSEL_MARGIN_TOP,
    alignSelf: 'center',
    height: '100%',
  },
  // slideStyle: {
  //   borderRadius: 10,
  // },
});

export default memo(PassageItemCarousel);
