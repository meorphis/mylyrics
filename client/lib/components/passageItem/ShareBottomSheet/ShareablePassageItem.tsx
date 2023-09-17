import ViewShot from 'react-native-view-shot';
import {ShareablePassage} from '../../../utility/shareable_passage';
import {useEffect, useState} from 'react';
import {getPassageId} from '../../../utility/passage_id';
import {StyleSheet, View} from 'react-native';
import React from 'react';
import PassageItem from '../PassageItem';

type Props = {
  shareablePassage: ShareablePassage;
  setHeight: ({
    lyricCardHeight,
    expand,
  }: {
    lyricCardHeight: number;
    expand: boolean;
  }) => void;
  viewShotRef: React.RefObject<ViewShot>;
  maxContainerHeight?: number;
  sharedTransitionKey: string;
};

const ShareablePassageItem = (props: Props) => {
  console.log(
    `rendering ShareablePassageItem ${props.shareablePassage.passage.song.name}`,
  );

  const {
    shareablePassage,
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
  }, [
    localHeight > 0,
    shareablePassage &&
      `${getPassageId(shareablePassage.passage)}-${shareablePassage.counter}`,
  ]);

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
        {shareablePassage && (
          <PassageItem
            key={getPassageId(shareablePassage.passage)}
            passage={shareablePassage.passage}
            sharedTransitionKey={sharedTransitionKey}
            maxContainerHeight={maxContainerHeight}
            omitActionBar
            ignoreFlex
            omitBorder
          />
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
