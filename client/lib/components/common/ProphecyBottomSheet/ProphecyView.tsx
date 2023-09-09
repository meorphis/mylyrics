import React from 'react';
import {useTheme} from '../../../utility/theme';
import {ensureColorContrast, isColorLight} from '../../../utility/color';
import tinycolor from 'tinycolor2';
import {getLyricsColor} from '../../../utility/lyrics';
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
  const theme = useTheme();
  const backgroundColor = theme.backgroundColor;
  const textColor = getLyricsColor({theme});
  const trigger = `${prophecy != null}-${prophecyRequestStatus === 'loading'}`;

  const renderContent = () => {
    if (prophecy) {
      return (
        <ComputedProphecyView
          prophecy={prophecy}
          backgroundColor={getContrastingBackgroundColor(backgroundColor)}
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
        theme={theme}
        backgroundColor={getContrastingBackgroundColor(backgroundColor)}
        onSubmit={() => makeProphecyRequest(cards)}
      />
    );
  };

  return <CrossFadeView trigger={trigger} renderContent={renderContent} />;
};

const getContrastingBackgroundColor = (backgroundColor: string) => {
  const {lightenable, darkenable} = ensureColorContrast({
    lightenable: backgroundColor,
    darkenable: backgroundColor,
    preference: isColorLight(backgroundColor) ? 'darken' : 'lighten',
    minDistance: 6,
  });

  const color = isColorLight(backgroundColor) ? darkenable : lightenable;
  return tinycolor(color).setAlpha(0.5).toRgbString();
};

export default ProphecyView;
