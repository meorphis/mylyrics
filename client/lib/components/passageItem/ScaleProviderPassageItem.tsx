import React, {useState} from 'react';
import {ScaleProvider} from '../../utility/max_size';
import PassageItem, {PassageItemProps} from './PassageItem';

const ScaleProviderPassageItem = (props: PassageItemProps) => {
  console.log(
    `rendering ScaleProviderPassageItem ${props.passageItemKey?.passageKey}`,
  );

  const [passageLyricsContainerHeight, setPassageLyricsContainerHeight] =
    useState<number | null>(null);

  return (
    <ScaleProvider maxSize={passageLyricsContainerHeight}>
      <PassageItem
        {...props}
        onPassageLyricsContainerLayout={event =>
          setPassageLyricsContainerHeight(event.nativeEvent.layout.height)
        }
      />
    </ScaleProvider>
  );
};

export default ScaleProviderPassageItem;
