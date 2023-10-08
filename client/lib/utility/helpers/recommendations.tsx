import {RawPassageType} from '../../types/passage';
import {BundleType, UnhydratedBundlePassageType} from '../../types/bundle';
import {getPassageId} from './passage';
import {getThemeFromAlbumColors} from './theme';
import {cleanLyrics} from './lyrics';

// takes an array of raw passages as well as a set of bundle keys divided into groups,
// hydrates the passages and adds them to their associated bundles which are then returned
export const getUnhydratedBundlesFromFlatPassages = async (
  flatPassages: RawPassageType[],
  sentiments: string[],
): Promise<BundleType[]> => {
  const bundles: BundleType[] = [];
  flatPassages.forEach((passage, idx) => {
    passage.bundleInfos.forEach(bundleInfo => {
      if (!cleanLyrics(passage.song.lyrics).includes(passage.lyrics)) {
        return;
      }

      if (passage.type !== bundleInfo.type) {
        return;
      }

      if (
        bundleInfo.type === 'sentiment' &&
        !sentiments.includes(bundleInfo.sentiment)
      ) {
        return;
      }

      let passages = bundles.find(
        ({info: {key: bk}}) => bk === bundleInfo.key,
      )?.passages;

      if (passages == null) {
        passages = {
          hydrated: false,
          data: [] as UnhydratedBundlePassageType[],
        };
        bundles.push({
          passages,
          info: bundleInfo,
        });
      }

      (
        passages as {
          hydrated: false;
          data: UnhydratedBundlePassageType[];
          error: boolean;
        }
      ).data.push({
        ...passage,
        passageKey: getPassageId(passage),
        sortKey: idx,
        bundleKey: bundleInfo.key,
        theme: getThemeFromAlbumColors(passage.song.album.image.colors),
      });
    });
  });

  // randomize the order of the top passages bundle
  bundles
    .find(({info}) => info.type === 'top')
    ?.passages.data.sort(() => Math.random());

  // avoid having the same artist back to back in the sentiment bundle
  bundles
    .filter(({info}) => info.type === 'sentiment')
    .forEach(bundle => {
      reorderPassages(
        bundle.passages.data,
        passage => passage.song.artists[0].name,
      );
    });

  // avoid having the same album back to back in the artist bundles
  bundles
    .filter(({info}) => info.type === 'artist')
    .forEach(bundle => {
      reorderPassages(bundle.passages.data, passage => passage.song.album.name);
    });

  return bundles;
};

// takes an array of passages and a function to get a key from a passage
// and tries to reorder the passages so that passages with the same key
// are not back to back
const reorderPassages = (
  passages: RawPassageType[],
  getKey: (passage: RawPassageType) => string,
) => {
  const keyToPassages = Object.entries(
    passages.reduce((acc, passage) => {
      const key = getKey(passage);
      if (acc[key] == null) {
        acc[key] = [];
      }
      acc[key].push(passage);
      return acc;
    }, {} as {[key: string]: RawPassageType[]}),
  ).sort(([, passagesA], [, passagesB]) => passagesB.length - passagesA.length);
  const usedIndexes = new Set<number>();
  const indexToPassage = {} as {[index: number]: RawPassageType};

  // i'm not sure how mathematically sound this logic is, but it will at least
  // roughly distribute the passages evenly
  keyToPassages.forEach(([, ps]) => {
    ps.forEach((passage, index) => {
      let desiredIndex = Math.floor((passages.length / ps.length) * index);
      while (usedIndexes.has(desiredIndex)) {
        desiredIndex = (desiredIndex + 1) % passages.length;
      }
      usedIndexes.add(desiredIndex);
      indexToPassage[desiredIndex] = passage;
    });
  });

  passages.forEach((_, index) => {
    passages[index] = indexToPassage[index];
  });
};
