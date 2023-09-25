import React from 'react';
import ComputedProphecyView from './ComputedProphecyView';
import ProphecyCardsView from './ProphecyCardsView';
import {useProphecyRequest} from '../../utility/helpers/prophecy';
import CrossFadeView from '../common/CrossFadeView';
import CrystalBall from './CrystalBall';
import {PassageType} from '../../types/passage';

type Props = {
  cards: PassageType[];
  prophecy: string | null;
};

// shows the prophecy cards, loading screen, or computed prophecy depending on state;
// uses a cross fade animation to transition smoothly between states
const ProphecyView = (props: Props) => {
  const {cards, prophecy} = props;

  const {requestStatus, makeProphecyRequest} = useProphecyRequest();
  const textColor = 'black';
  const trigger = `${prophecy != null}-${requestStatus === 'loading'}`;

  const renderContent = () => {
    if (prophecy) {
      return (
        <ComputedProphecyView
          prophecy={prophecy}
          backgroundColor="#00000040"
          textColor={textColor}
        />
      );
    }

    if (requestStatus === 'loading') {
      return (
        <CrystalBall imageUrls={cards.map(c => c.song.album.image.blob)} />
      );
    }

    return (
      <ProphecyCardsView
        cards={cards}
        backgroundColor="#00000040"
        onSubmit={() => makeProphecyRequest(cards)}
      />
    );
  };

  return <CrossFadeView trigger={trigger} renderContent={renderContent} />;
};

export default ProphecyView;
