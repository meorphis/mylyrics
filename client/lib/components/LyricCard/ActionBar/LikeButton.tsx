import React from 'react';
import ActionBarButton from './ActionBarButton';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {useLikeRequest} from '../../../utility/db/likes';
import {PassageType} from '../../../types/passage';

type Props = {
  passage: PassageType;
};

// button to mark the passage as liked (or to unmark as liked)
const LikeButton = (props: Props) => {
  const {passage} = props;
  const {request: likeRequest, toggleLike} = useLikeRequest(passage);

  return (
    <ActionBarButton
      onPress={() => {
        if (likeRequest.status === 'loading') {
          return;
        }

        // disable unliking for now
        if (!likeRequest.data) {
          toggleLike();
        }
      }}
      theme={passage.theme}
      defaultState={{
        text: 'like',
        icon: 'heart-outline',
        IconClass: Ionicon,
      }}
      isActive={likeRequest.data}
      activeState={{
        text: 'liked',
        icon: 'heart',
        IconClass: Ionicon,
      }}
      // disable unliking for now
      disableIfActive
    />
  );
};

export default LikeButton;
