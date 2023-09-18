import {useState} from 'react';
import {useDeviceId} from '../device_id';
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
import {
  addLoadedPassageGroups,
  initPassageGroups,
} from '../redux/recommendations';
import {errorToString} from '../error';
import {RawPassageType} from '../../types/passage';
import {setProphecy} from '../redux/prophecy';
import {setSentimentGroups} from '../redux/sentiment_groups';
import {getPassageGroups} from '../recommendations';
import {useSetActivePassage} from '../active_passage';

// Returns a function to get make a request along with the result of that request;
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
      const sentiments = rec.tags.map(({sentiment}) => sentiment);
      sentiments.forEach(sentiment => {
        if (impressions[sentiment] == null) {
          impressions[sentiment] = [];
        }
        if (impressions[sentiment].includes(songId)) {
          return;
        }
        impressions[sentiment].push(songId);
      });
    });
    transaction.set(docRef, {value: impressions}, {merge: true});
  });
};

const useSetupRecommendations = ({deviceId}: {deviceId: string}) => {
  const dispatch = useDispatch();
  const setActivePassage = useSetActivePassage();

  const setupRecommendations = async ({
    docSnap,
  }: {
    docSnap: DocumentSnapshot<DocumentData, DocumentData>;
  }) => {
    if (!docSnap.exists()) {
      return false;
    }

    const data = docSnap.data();
    const sentimentGroups = data.sentiments as {
      group: string;
      sentiments: string[];
    }[];
    const flatSentiments = sentimentGroups
      .map(({sentiments}) => sentiments)
      .flat();

    const flatRecommendations = data.recommendations as RawPassageType[];
    const prophecy = data.prophecy as string;

    updateImpressions({deviceId, passages: flatRecommendations});

    const passageGroups = await getPassageGroups(
      flatRecommendations,
      flatSentiments,
    );

    const activeGroupKey = flatSentiments[0];
    const activePassage = passageGroups.find(p => p.groupKey === activeGroupKey)
      ?.passageGroup[0]?.passage;

    if (activePassage == null) {
      throw new Error(`could not find active passage for ${activeGroupKey}`);
    }

    dispatch(initPassageGroups(flatSentiments));
    dispatch(addLoadedPassageGroups(passageGroups));
    dispatch(setSentimentGroups(sentimentGroups));
    setActivePassage({
      groupKey: activeGroupKey,
      passage: activePassage,
    });
    dispatch(setProphecy(prophecy ?? null));

    return true;
  };

  return setupRecommendations;
};
