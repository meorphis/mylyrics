import {useSelector} from 'react-redux';
import {RootState} from '..';
import _ from 'lodash';

export const useAlbumArt = (
  url: string | undefined,
): string | null | undefined => {
  return useAlbumArtMulti(url ? [url] : undefined)[0];
};

export const useAlbumArtMulti = (
  urls: string[] | undefined,
): (string | null | undefined)[] => {
  const albumArt = useSelector(
    (state: RootState) => (urls ? urls.map(url => state.albumArt[url]) : []),
    _.isEqual,
  );
  return albumArt;
};
