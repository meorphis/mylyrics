import React from 'react';
import ComputedProphecyView from './ComputedProphecyView';
import ProphecyCardsView from './ProphecyCardsView';
import {useProphecyRequest} from '../../../utility/prophecy';
import CrossFadeView from '../CrossFadeView';
import CrystalBall from './CrystalBall';
import {PassageType} from '../../../types/passage';

type Props = {
  cards: PassageType[];
  prophecy: string | null;
};

const ProphecyView = (props: Props) => {
  const {cards, prophecy} = props;

  const {status: prophecyRequestStatus, makeProphecyRequest} =
    useProphecyRequest();
  const textColor = 'black';
  const trigger = `${prophecy != null}-${prophecyRequestStatus === 'loading'}`;

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

    if (prophecyRequestStatus === 'loading') {
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
