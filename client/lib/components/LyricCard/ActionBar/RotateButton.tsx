import React from 'react';
import ActionBarButton from './ActionBarButton';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {PassageType} from '../../../types/passage';

type Props = {
  passage: PassageType;
  shouldUseAnalysis: boolean;
  rotate: () => void;
};

// button to add the passage to the selected set of prophecy cards
const RotateButton = (props: Props) => {
  const {passage, shouldUseAnalysis, rotate} = props;

  return (
    <ActionBarButton
      onPress={rotate}
      theme={passage.theme}
      defaultState={{
        text: shouldUseAnalysis ? "lyrics" : "prophecy",
        icon: '360',
        IconClass: MaterialIcon,
      }}
    />
  );
};

export default RotateButton;
