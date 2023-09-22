import React, {memo, useEffect} from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import NativeCarousel from '../../forks/react-native-reanimated-carousel/src';
import {PassageType} from '../../types/passage';
import {WithSharedTransitionKey} from '../passageItem/WithSharedTransitionKey';
import {WithPassageItemMeasurement} from '../passageItem/WithPassageItemMeasurement';
import PassageItem from '../passageItem/PassageItem';
import {
  useIsActiveGroup,
  useSetActivePassage,
} from '../../utility/active_passage';
// import {useUpdateSequentialWalkthroughStep} from '../../utility/walkthrough';
import {useThemeUpdate} from '../../utility/theme';
import {usePassageItemSize} from '../../utility/max_size';

const Carousel = memo(NativeCarousel, (prev, next) => {
  if (prev.data.length !== next.data.length) {
    return false;
  }

  prev.data.forEach((d, i) => {
    if (
      (d as PassageCarouselItem).passageKey !==
      (next.data[i] as PassageCarouselItem).passageKey
    ) {
      return false;
    }
  });

  return true;
});

const PassageItemComponent = memo(
  WithSharedTransitionKey(WithPassageItemMeasurement(PassageItem)),
  () => true,
);

type PassageCarouselItem = {
  passageKey: string;
  passage: PassageType;
};

type Props = {
  groupKey: string;
  data: PassageCarouselItem[];
};

const PassageItemCarousel = (props: Props) => {
  console.log('rendering PassageItemCarousel');

  const {groupKey} = props;
  const {sharedProgress} = useThemeUpdate();
  const {
    marginTop,
    marginHorizontal,
    height: passageItemHeight,
    carouselClearance,
  } = usePassageItemSize();

  const {data} = props;

  const ref = React.useRef<NativeCarousel>(null);
  const setActivePassage = useSetActivePassage({groupKey});
  const isActiveGroup = useIsActiveGroup(groupKey);
  // const updateSequentialWalkthroughStep = useUpdateSequentialWalkthroughStep();

  const [dataCache, setDataCache] = React.useState<PassageCarouselItem[]>(data);

  useEffect(() => {
    if (data.length !== dataCache.length) {
      ref.current?.scrollTo({
        animated: true,
        count: 1,
        onFinished: () => setDataCache(data),
      });
    }
  }, [data.length]);

  // const [index, setIndex] = React.useState<number>(0);

  // const [scrollEnabled, setScrollEnabled] = React.useState(true);

  return (
    <Carousel
      ref={ref}
      style={{...styles.carouselContainer}}
      // slideStyle={styles.slideStyle}
      loop
      // loopClonesPerSide={0}
      data={dataCache}
      // itemHeight={Dimensions.get('window').height * 0.75}
      // sliderHeight={Dimensions.get('window').height * 0.75}
      height={passageItemHeight + carouselClearance}
      width={Dimensions.get('window').width}
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
      onProgressChange={(__, absoluteProgress: number) => {
        'worklet';
        sharedProgress.value = absoluteProgress;
      }}
      // activeAnimationType="decay"
      // firstItem={firstItem}
      // onBeforeSnapToItem={(slideIndex: number) => {
      onSnapToItem={(slideIndex: number) => {
        // // prevent unnecessarily fast scrolling due to performance limitations
        // setScrollEnabled(false);
        // setTimeout(() => {
        //   setScrollEnabled(true);
        // }, 250);

        const {passageKey} = dataCache[slideIndex];

        if (isActiveGroup) {
          console.log(`set active passage: ${groupKey} ${passageKey}`);
          setActivePassage({passageKey});
        }

        // setTimeout(() => {
        //   updateSequentialWalkthroughStep();
        // }, 250);
      }}
      // enabled={scrollEnabled && data.length > 1}
      renderItem={({item}: {item: unknown}) => {
        return (
          <PassageItemComponent
            passage={(item as PassageCarouselItem).passage}
            style={{marginTop, marginHorizontal}}
          />
        );
      }}
      keyExtractor={(item: unknown) => (item as PassageCarouselItem).passageKey}
      snapEnabled={false}
      autoFillData={false}
      // pagingEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    alignSelf: 'center',
    height: '100%',
  },
  // slideStyle: {
  //   borderRadius: 10,
  // },
});

export default PassageItemCarousel;
