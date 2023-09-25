import {RawPassageType} from '../../types/passage';
import {BundleType} from '../../types/bundle';
import {hydratePassage} from './passage';

// takes an array of raw passages as well as a set of bundle keys divided into groups,
// hydrates the passages and adds them to their associated bundles which are then returned
export const getBundlesFromFlatPassages = async (
  flatPassages: RawPassageType[],
  bundleGroups: {
    groupName: string;
    bundleKeys: string[];
  }[],
): Promise<BundleType[]> => {
  const hydratedPassages = await Promise.all(flatPassages.map(hydratePassage));

  const bundleKeyToGroup: {[key: string]: string} = {};
  bundleGroups.forEach(({groupName, bundleKeys}) => {
    bundleKeys.forEach(k => {
      bundleKeyToGroup[k] = groupName;
    });
  });
  const filterBundleKeys = Object.keys(bundleKeyToGroup);

  const bundles: BundleType[] = [];
  hydratedPassages.forEach((passage, idx) => {
    passage.bundleKeys.forEach(bundleKey => {
      if (filterBundleKeys && !filterBundleKeys.includes(bundleKey)) {
        return;
      }

      let passages = bundles.find(
        ({bundleKey: bk}) => bk === bundleKey,
      )?.passages;

      if (passages == null) {
        passages = [];
        bundles.push({
          bundleKey,
          passages,
          creator: {type: 'machine'},
          groupName: bundleKeyToGroup[bundleKey],
        });
      }

      passages.push({
        ...passage,
        bundleKey,
        sortKey: idx,
      });
    });
  });

  return bundles;
};
