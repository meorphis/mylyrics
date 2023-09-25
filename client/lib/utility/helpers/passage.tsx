import {PassageType, RawPassageType} from '../../types/passage';
import {getThemeFromAlbumColors} from './theme';
import {v5 as uuidv5} from 'uuid';
import {CacheManager} from '@georstat/react-native-image-cache';

// takes a passages as stored in the DB and converts it to the format expected by
// the UI by hydrating it with an image blob, a theme, and a key
export const hydratePassage = async (
  rawPassage: RawPassageType,
): Promise<PassageType & {bundleKeys: string[]}> => {
  const blob = await fetchImageBlob(rawPassage.song.album.image.url);
  const theme = getThemeFromAlbumColors(rawPassage.song.album.image.colors);

  return {
    ...rawPassage,
    passageKey: getPassageId(rawPassage),
    song: {
      ...rawPassage.song,
      album: {
        ...rawPassage.song.album,
        image: {
          ...rawPassage.song.album.image,
          blob,
        },
      },
    },
    theme,
  };
};

// generates a unique id for a passage based on its song id and lyrics
export const getPassageId = (passage: RawPassageType | PassageType): string => {
  return uuidv5(
    passage.song.id + passage.lyrics,
    '3f6d2929-046d-41bd-87d2-630373a17e63',
  );
};

const fetchImageBlob = async (url: string) => {
  const blob =
    'data:image/jpeg;base64,' + (await CacheManager.prefetchBlob(url!, {}));
  return blob;
};
