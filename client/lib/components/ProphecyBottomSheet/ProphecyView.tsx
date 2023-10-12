import React from 'react';
import ComputedProphecyView from './ComputedProphecyView';
import ProphecyCardsView from './ProphecyCardsView';
import {useProphecyRequest} from '../../utility/helpers/prophecy';
import CrossFadeView from '../common/CrossFadeView';
import CrystalBall from './CrystalBall';
import {PassageType} from '../../types/passage';
import {useAlbumArtMulti} from '../../utility/redux/album_art/selectors';

type Props = {
  cards: PassageType[];
  prophecy: string | null;
};

// shows the prophecy cards, loading screen, or computed prophecy depending on state;
// uses a cross fade animation to transition smoothly between states
const ProphecyView = (props: Props) => {
  const {cards, prophecy} = props;

  const albumArt = useAlbumArtMulti(cards.map(c => c.song.album.image.url));

  const {requestStatus, makeProphecyRequest} = useProphecyRequest();
  const trigger = `${prophecy != null}-${requestStatus === 'loading'}`;

  const renderContent = () => {
    if (prophecy) {
      return <ComputedProphecyView prophecy={prophecy} />;
    }

    if (requestStatus === 'loading') {
      return <CrystalBall imageUrls={albumArt.filter(Boolean) as string[]} />;
    }

    return (
      <ProphecyCardsView
        cards={cards}
        onSubmit={() => makeProphecyRequest(cards)}
      />
    );
  };

  return <CrossFadeView trigger={trigger} renderContent={renderContent} />;
};

export default ProphecyView;
