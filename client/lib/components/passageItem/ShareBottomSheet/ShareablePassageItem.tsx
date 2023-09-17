import ViewShot from 'react-native-view-shot';
import {useEffect, useState} from 'react';
import {getPassageId} from '../../../utility/passage_id';
import {StyleSheet, View} from 'react-native';
import React from 'react';
import PassageItem from '../PassageItem';
import {PassageType} from '../../../types/passage';
import {PassageItemMeasurementProvider} from '../../../utility/max_size';

type Props = {
  passage: PassageType;
  setHeight: ({
    lyricCardHeight,
    expand,
  }: {
    lyricCardHeight: number;
    expand: boolean;
  }) => void;
  viewShotRef: React.RefObject<ViewShot>;
  maxContainerHeight: number;
  sharedTransitionKey: string;
};

const ShareablePassageItem = (props: Props) => {
  console.log(`rendering ShareablePassageItem ${props.passage.song.name}`);

  const {
    passage,
    sharedTransitionKey,
    setHeight,
    viewShotRef,
    maxContainerHeight,
  } = props;
  const [localHeight, setLocalHeight] = useState<number>(0);

  const onLayout = (event: any) => {
    const {height} = event.nativeEvent.layout;
    setLocalHeight(height);
  };

  useEffect(() => {
    if (localHeight > 0) {
      setHeight({lyricCardHeight: localHeight, expand: true});
    }
  }, [localHeight, passage && getPassageId(passage)]);

  useEffect(() => {
    setHeight({lyricCardHeight: localHeight, expand: false});
  }, [localHeight]);

  return (
    <View
      onLayout={onLayout}
      style={{
        ...styles.container,
      }}>
      <ViewShot ref={viewShotRef} options={{format: 'png'}}>
        {passage && (
          <PassageItemMeasurementProvider
            passageId={getPassageId(props.passage)}>
            <PassageItem
              key={getPassageId(passage)}
              passage={passage}
              sharedTransitionKey={sharedTransitionKey}
              maxContainerHeight={maxContainerHeight}
              omitActionBar
              ignoreFlex
              omitBorder
            />
          </PassageItemMeasurementProvider>
        )}
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    minWidth: '90%',
    maxWidth: '90%',
  },
});

export default ShareablePassageItem;
