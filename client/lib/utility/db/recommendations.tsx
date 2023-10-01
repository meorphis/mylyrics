import {useState} from 'react';
import {useDeviceId} from '../contexts/device_id';
import db from './firestore';
import {
  doc,
  collection,
  getDoc,
  runTransaction,
  onSnapshot,
  DocumentSnapshot,
  DocumentData,
} from '@firebase/firestore';
import {RequestType} from '../../types/request';
import {useDispatch} from 'react-redux';
import {errorToString} from '../helpers/error';
import {RawPassageType} from '../../types/passage';
import {setProphecy} from '../redux/prophecy/slice';
import {getBundlesFromFlatPassages} from '../helpers/recommendations';
import {addBundles, setActiveBundlePassage} from '../redux/bundles/slice';
import {CacheManager} from '@georstat/react-native-image-cache';

// returns a function to get make a request along with the result of that request;
// the request gets the user's recommendations from the database fetches image data
// for each recommendation, and dispatches the data to the redux store;
// recommendationsRequest.data is true if recommendations were found, false otherwise
export const useRecommendationsRequest = () => {
  const [recommendationsRequest, setRecommendationsRequest] = useState<
    RequestType<number>
  >({
    status: 'init',
  });

  const deviceId = useDeviceId();
  const setupRecommendations = useSetupRecommendations({deviceId});

  const makeRecommendationsRequest = async () => {
    // keep the user's settings up to date
    onSnapshot(doc(collection(db, 'user-recommendations'), deviceId), d => {
      if (
        recommendationsRequest.status === 'loaded' &&
        d.data()?.lastRefreshedAt !== recommendationsRequest.data
      ) {
        // TODO: if the app is open, show a banner prompting the user to refresh
        makeRequest();
      }
    });

    const makeRequest = async () => {
      setRecommendationsRequest({status: 'loading'});

      try {
        const docSnap = await getDoc(
          doc(collection(db, 'user-recommendations'), deviceId),
        );

        const recommendationsExist = await setupRecommendations({docSnap});

        setRecommendationsRequest({
          status: 'loaded',
          data: recommendationsExist ? docSnap.data()?.lastRefreshedAt : null,
        });
      } catch (e) {
        console.error(e);
        setRecommendationsRequest({
          status: 'error',
          error: errorToString(e),
        });
      }
    };

    makeRequest();
  };

  return {
    recommendationsRequest,
    makeRecommendationsRequest,
  };
};

export const updateImpressions = async ({
  deviceId,
  passages,
}: {
  deviceId: string;
  passages: RawPassageType[];
}) => {
  const docRef = doc(collection(db, 'user-impressions-today'), deviceId);

  // there's a possible race condition where the user's impressions are updated here
  // after we've cleared them out in refreshUser on the back-end (but before the user
  // sees the new daily recs); this seems rare enough that it's fine to ignore for now
  await runTransaction(db, async transaction => {
    const docSnap = await transaction.get(docRef);
    const data = docSnap.data();
    const impressions = data?.impressions ?? {};
    let itemsAdded = false;
    passages.forEach(rec => {
      const songId = rec.song.id;

      let keys: string[] = [];
      if (rec.type === 'top') {
        keys = ['top'];
      } else if (rec.type === 'sentiment') {
        keys = rec.bundleInfos
          .filter(bi => bi.type === 'sentiment')
          //@ts-ignore
          .map(bi => bi.sentiment);
      }

      keys.forEach(bundleKey => {
        if (impressions[bundleKey] == null) {
          impressions[bundleKey] = [];
        }
        if (impressions[bundleKey].includes(songId)) {
          return;
        }
        impressions[bundleKey].push(songId);
        itemsAdded = true;
      });
    });
    if (itemsAdded) {
      transaction.set(docRef, {value: impressions}, {merge: true});
    }
  });
};

const useSetupRecommendations = ({deviceId}: {deviceId: string}) => {
  const dispatch = useDispatch();

  const setupRecommendations = async ({
    docSnap,
  }: {
    docSnap: DocumentSnapshot<DocumentData, DocumentData>;
  }) => {
    if (!docSnap.exists()) {
      return false;
    }

    const data = docSnap.data();

    const recommendations = data.recommendations as RawPassageType[];
    const sentiments = data.sentiments as string[];
    const prophecy = data.prophecy as string;

    updateImpressions({deviceId, passages: recommendations});

    await CacheManager.clearCache();
    const bundles = await getBundlesFromFlatPassages(
      recommendations,
      sentiments,
    );

    dispatch(addBundles(bundles));
    dispatch(setActiveBundlePassage(bundles[0].passages[0]));
    dispatch(setProphecy(prophecy ?? null));

    return true;
  };

  return setupRecommendations;
};
