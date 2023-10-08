import {PassageType, RawPassageType} from '../../types/passage';
import {v5 as uuidv5} from 'uuid';
import {CacheManager} from '@georstat/react-native-image-cache';
import _ from 'lodash';
import {
  BundlePassageType,
  UnhydratedBundlePassageType,
} from '../../types/bundle';

// takes a passages as stored in the DB and converts it to the format expected by
// the UI by hydrating it with an image blob, a theme, and a key
export const hydratePassage = async (
  rawPassage: UnhydratedBundlePassageType,
): Promise<BundlePassageType> => {
  const blob = await fetchImageBlob(rawPassage.song.album.image.url);

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
  };
};

// inverts hydratePassage so that we can save a passage to the DB
export const dehydratePassage = (passage: PassageType): RawPassageType => {
  const rawPassage = _.cloneDeep(passage) as RawPassageType & {
    theme?: any;
    passageKey?: any;
    song: any & {
      album: any & {
        image: any & {
          blob?: any;
        };
      };
    };
  };
  delete rawPassage.theme;
  delete rawPassage.passageKey;
  delete rawPassage.song.album.image.blob;

  return rawPassage;
};

// generates a unique id for a passage based on its song id and lyrics
// needs to have the same output as the uuidForPassage function on the server side
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
