import React from 'react';
import {
  useCanDrawPhophecyCard,
  useCanUndrawPhophecyCard,
  useIsProphecyCardDrawn,
} from '../../../utility/redux/prophecy/selectors';
import ActionBarButton from './ActionBarButton';
import {useDispatch} from 'react-redux';
import {addCard, removeCard} from '../../../utility/redux/prophecy/slice';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {PassageType} from '../../../types/passage';

type Props = {
  passage: PassageType;
};

// button to add the passage to the selected set of prophecy cards
const DrawProphecyCardButton = (props: Props) => {
  const {passage} = props;
  const {passageKey} = passage;

  const dispatch = useDispatch();
  const isDrawn = useIsProphecyCardDrawn({passageKey});
  const canDraw = useCanDrawPhophecyCard();
  const canUndraw = useCanUndrawPhophecyCard();

  return (
    <ActionBarButton
      onPress={() => {
        if (isDrawn) {
          dispatch(removeCard(passage));
          return;
        }

        if (!canDraw) {
          return;
        }

        dispatch(addCard(passage));
      }}
      theme={passage.theme}
      defaultState={{
        text: 'draw',
        icon: 'add-circle-outline',
        IconClass: Ionicon,
      }}
      isActive={isDrawn}
      activeState={{
        text: 'drawn',
        icon: 'add-circle',
        IconClass: Ionicon,
      }}
      isDisabled={(!isDrawn && !canDraw) || (isDrawn && !canUndraw)}
    />
  );
};

export default DrawProphecyCardButton;
