import React from 'react';
import ActionBarButton from './ActionBarButton';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {setBottomSheetTriggered} from '../../../utility/redux/shareable_passage/slice';
import ThemeType from '../../../types/theme';

type Props = {
  theme: ThemeType;
};

// button to trigger the bottom sheet to share the passage
const ShareButton = (props: Props) => {
  const {theme} = props;
  const dispatch = useDispatch();

  return (
    <ActionBarButton
      onPress={() => {
        dispatch(setBottomSheetTriggered(true));
      }}
      theme={theme}
      defaultState={{
        text: 'share',
        icon: 'share-outline',
        IconClass: Ionicon,
      }}
    />
  );
};

export default ShareButton;
