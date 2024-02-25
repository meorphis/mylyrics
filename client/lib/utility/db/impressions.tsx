import {collection, doc, runTransaction, updateDoc} from '@firebase/firestore';
import {BundleType} from '../../types/bundle';
import db from './firestore';
import {useEffect, useState} from 'react';
import _ from 'lodash';
import {useAllRequestedBundles} from '../redux/requested_bundle_change/selectors';
import {useDeviceId} from '../contexts/device_id';
import {getPassageId} from '../helpers/passage';

// a hook that updates the user's logged impressions in firestore when they request a new bundle
export const useImpressionsUpdates = () => {
  const allRequestedBundles = useAllRequestedBundles();
  const deviceId = useDeviceId();
  const allRequestedBundleKeys = allRequestedBundles.map(
    bundle => bundle.info.key,
  );
  const [allRequestedBundleKeysState, setAllRequestedBundleKeysState] =
    useState<string[]>(allRequestedBundleKeys);

  useEffect(() => {
    const difference = _.difference(
      allRequestedBundleKeys,
      allRequestedBundleKeysState,
    );
    if (difference.length > 0) {
      setAllRequestedBundleKeysState(allRequestedBundleKeys);
      difference.forEach(bundleKey => {
        const bundle = allRequestedBundles.find(b => b.info.key === bundleKey);
        if (bundle) {
          maybeUpdateImpressions({
            deviceId,
            bundle,
          });
        }
      });
    }
  }, [allRequestedBundleKeys]);
};

const maybeUpdateImpressions = async ({
  deviceId,
  bundle,
}: {
  deviceId: string;
  bundle: BundleType;
}) => {
  updateDoc(
    doc(collection(db, 'user-recommendations'), deviceId),
    {lastRequestAt: Date.now()}
  )
  

  if (!['sentiment', 'top'].includes(bundle.info.type)) {
    return;
  }

  const docRef = doc(collection(db, 'user-impressions-today'), deviceId);

  // there's a possible race condition where the user's impressions are updated here
  // after we've cleared them out in refreshUser on the back-end (but before the user
  // sees the new daily recs); this seems rare enough that it's fine to ignore for now
  await runTransaction(db, async transaction => {
    const docSnap = await transaction.get(docRef);
    const data = docSnap.data();
    const impressions = data?.impressions ?? {};
    let itemsAdded = false;
    bundle.passages.forEach(passage => {
      const passageKey = getPassageId(passage);
      const songId = passage.song.id;

      let keys: string[] = [];
      if (bundle.info.type === 'top') {
        keys = ['top', 'top-passages'];
      } else if (bundle.info.type === 'sentiment') {
        keys = passage.bundleInfos
          .map(i => (i.type === 'sentiment' ? i.sentiment : null))
          .filter(i => i != null) as string[];
      }

      keys.forEach(key => {
        const id = key === 'top-passages' ? passageKey : songId;

        if (impressions[key] == null) {
          impressions[key] = [];
        }
        if (impressions[key].includes(id)) {
          return;
        }
        impressions[key].push(id);
        itemsAdded = true;
      });
    });
    if (itemsAdded) {
      transaction.set(docRef, {value: impressions}, {merge: true});
    }
  });
};
