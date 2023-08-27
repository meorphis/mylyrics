import React, {memo} from 'react';
import {useRef} from 'react';
import {Image} from 'react-native';
import ViewShot, {captureScreen} from 'react-native-view-shot';
import PassageItem, {PassageItemProps} from './PassageItem';

export type ViewShotPassageItemProps = Omit<
  PassageItemProps,
  'captureViewShot'
>;

const ViewShotPassageItem = (props: ViewShotPassageItemProps) => {
  const viewShotRef = useRef<ViewShot>(null);

  const captureViewShot = (callback: (uri: string) => void) => {
    if (!viewShotRef.current) {
      return;
    }
    viewShotRef.current!.capture!().then(uri => {
      // Convert the image URI to Base64
      Image.getSize(uri, (width, height) => {
        const imgConfig = {
          offset: {x: 0, y: 0},
          width,
          height,
        };

        captureScreen(imgConfig).then(base64 => {
          console.log('BASE64', base64); // Outputs the Base64 encoded string
          callback(base64);
        });
      });
    });
  };

  return (
    <ViewShot
      style={{flex: 1}}
      ref={viewShotRef}
      options={{format: 'jpg', quality: 0.9}}>
      <PassageItem {...props} captureViewShot={captureViewShot} />
    </ViewShot>
  );
};

const MemoPassageItem = memo(
  ViewShotPassageItem,
  (prev: ViewShotPassageItemProps, next: ViewShotPassageItemProps) => {
    // only re-render when the passage theme has been determined
    return prev.passageTheme != null || next.passageTheme == null;
  },
);

export default MemoPassageItem;
