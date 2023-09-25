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
  await runTransaction(db, async transaction => {
    const docSnap = await transaction.get(docRef);
    const data = docSnap.data();
    const impressions = data?.impressions ?? {};
    passages.forEach(rec => {
      const songId = rec.song.id;
      rec.bundleKeys.forEach(bundleKey => {
        if (impressions[bundleKey] == null) {
          impressions[bundleKey] = [];
        }
        if (impressions[bundleKey].includes(songId)) {
          return;
        }
        impressions[bundleKey].push(songId);
      });
    });
    transaction.set(docRef, {value: impressions}, {merge: true});
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

    const {flatRecommendations, bundleGroups} = transformData(data);
    const prophecy = data.prophecy as string;

    updateImpressions({deviceId, passages: flatRecommendations});

    const bundles = await getBundlesFromFlatPassages(
      flatRecommendations,
      bundleGroups,
    );

    dispatch(addBundles(bundles));
    dispatch(setActiveBundlePassage(bundles[0].passages[0]));
    dispatch(setProphecy(prophecy ?? null));

    return true;
  };

  return setupRecommendations;
};

// a temporary function to transform the format currently saved by the server into the format
// that we will soon migrate to
const transformData = (data: DocumentData) => {
  const flatRecommendations = data.recommendations.map((r: any) => {
    return {
      ...r,
      bundleKeys: r.tags.map(({sentiment}: {sentiment: string}) => sentiment),
    } as RawPassageType;
  }) as RawPassageType[];

  const bundleGroups = (
    data.sentiments as {
      group: string;
      sentiments: string[];
    }[]
  ).map(({group, sentiments}) => {
    return {
      groupName: group,
      bundleKeys: sentiments,
    };
  });

  return {
    flatRecommendations,
    bundleGroups,
  };
};
