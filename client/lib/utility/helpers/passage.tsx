import {PassageType, RawPassageType} from '../../types/passage';
import {v5 as uuidv5} from 'uuid';
import {CacheManager} from '@georstat/react-native-image-cache';
import _ from 'lodash';
import { useDispatch } from 'react-redux';
import { addAlbumArt, maybeSetAlbumArtAsMissing } from '../redux/album_art/slice';

// passages stored in the DB have a URL for their album art, but we need to fetch the image blob
// to render the UI; this hook allows its caller to fetch the image blob and dispatch it to the
// redux store
export const usePassageHydration = () => {
  const dispatch = useDispatch();

  // hydrates a passage with its album art but stops awaiting the result after 2 seconds
  const hydrateUrlWithTimeout = async (url: string) => {
    const fn: () => void = await Promise.race([
      (async () => {
        try {
          const blob = await fetchImageBlob(url);
          dispatch(addAlbumArt({url, blob}));
          return () => {}
        } catch (e) {
          console.error(e);
          return () => dispatch(maybeSetAlbumArtAsMissing({url}));
        }
      })(),
      new Promise<() => void>(resolve => setTimeout(() => {
        resolve(() => dispatch(maybeSetAlbumArtAsMissing({url})));
      }, 2000)),
    ]);

    fn();
  }

  const hydratePassages = async (
    passages: RawPassageType[],
  ): Promise<void> => {
    
    Promise.all(
      passages.map(async (passage) => {
        const url = passage.song.album.image.url;
        await hydrateUrlWithTimeout(url);
      }),
    );
  }

  return hydratePassages;
}

// inverts hydratePassage so that we can save a passage to the DB
export const dehydratePassage = (passage: PassageType): RawPassageType => {
  const rawPassage = _.cloneDeep(passage) as RawPassageType & {
    theme?: any;
    passageKey?: any;
  };
  delete rawPassage.theme;
  delete rawPassage.passageKey;

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
