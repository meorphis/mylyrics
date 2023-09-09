import {WalkthroughStepStatus} from '../../types/walkthrough';
import Tooltip from 'react-native-walkthrough-tooltip';
import React from 'react';
import {Text, ViewStyle} from 'react-native';
import {textStyleCommon} from '../../utility/text';

type Props = {
  walkthroughStepStatus: WalkthroughStepStatus;
  setWalkthroughStepAsCompleted: () => void;
  text: string;
  childrenWrapperStyle?: ViewStyle;
  children: React.ReactNode;
};

const WalkthroughStepComponent = (props: Props) => {
  const {
    walkthroughStepStatus,
    setWalkthroughStepAsCompleted,
    text,
    childrenWrapperStyle,
    children,
  } = props;

  return walkthroughStepStatus === 'ready' ? (
    <Tooltip
      childrenWrapperStyle={childrenWrapperStyle}
      displayInsets={{left: 48, top: 0, right: 48, bottom: 0}}
      isVisible={walkthroughStepStatus === 'ready'}
      content={<Text style={{...textStyleCommon}}>{text}</Text>}
      placement="top"
      useInteractionManager={true}
      onClose={() => setWalkthroughStepAsCompleted()}>
      {children}
    </Tooltip>
  ) : (
    <React.Fragment>{children}</React.Fragment>
  );
};

export default WalkthroughStepComponent;
