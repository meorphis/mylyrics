import React, {memo} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import Carousel from '../../forks/react-native-reanimated-carousel/src';
import {PassageType} from '../../types/passage';
import {WithSharedTransitionKey} from '../passageItem/WithSharedTransitionKey';
import {WithPassageItemMeasurement} from '../passageItem/WithPassageItemMeasurement';
import PassageItem from '../passageItem/PassageItem';
import {useSetActivePassage} from '../../utility/active_passage';
import {useUpdateSequentialWalkthroughStep} from '../../utility/walkthrough';

const PassageItemComponent = memo(
  WithSharedTransitionKey(WithPassageItemMeasurement(PassageItem)),
  () => true,
);

export const CAROUSEL_MARGIN_TOP = 12;

type PassageCarouselItem = {
  passageKey: string;
  passage: PassageType;
};

type Props = {
  data: PassageCarouselItem[];
};

const PassageItemCarousel = (props: Props) => {
  console.log('rendering PassageItemCarousel');

  const setActivePassage = useSetActivePassage();
  const updateSequentialWalkthroughStep = useUpdateSequentialWalkthroughStep();

  const {data} = props;

  // const [index, setIndex] = React.useState<number>(0);

  // const [scrollEnabled, setScrollEnabled] = React.useState(true);

  return (
    <Carousel
      style={styles.carouselContainer}
      // slideStyle={styles.slideStyle}
      loop
      // loopClonesPerSide={0}
      data={data}
      // itemHeight={Dimensions.get('window').height * 0.75}
      // sliderHeight={Dimensions.get('window').height * 0.75}
      height={Dimensions.get('window').height * 0.6}
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
      // onBeforeSnapToItem={(slideIndex: number) => {
      onBeforeSnapToItem={(slideIndex: number) => {
        console.log('SLIDE INDEX', slideIndex);
        // // prevent unnecessarily fast scrolling due to performance limitations
        // setScrollEnabled(false);
        // setTimeout(() => {
        //   setScrollEnabled(true);
        // }, 250);

        const {passage} = data[slideIndex];

        setActivePassage({
          passage,
        });

        setTimeout(() => {
          updateSequentialWalkthroughStep();
        }, 250);
      }}
      // enabled={scrollEnabled && data.length > 1}
      renderItem={({item}: {item: PassageCarouselItem; index: number}) => {
        return <PassageItemComponent passage={item.passage} />;
      }}
      // keyExtractor={(item: PassageCarouselItem, idx: number) =>
      //   `${item.passageKey}:${idx}`
      // }
      snapEnabled
      // pagingEnabled={false}
    />
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
