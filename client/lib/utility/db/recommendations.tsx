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
import {setActivePassage} from '../redux/active_passage';
import {PassageGroupsType, RawPassageType} from '../../types/passage';
import {useCacheImageDataForUrls} from '../images';
import {setHoroscope} from '../redux/horoscope';
import {getPassageId} from '../passage_id';
import {initLikes, addLikes} from '../redux/likes';
import {setSentimentGroups} from '../redux/sentiment_groups';

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

// Groups recommendations into "passage groups" based on sentiment; a passage
// can be in multiple groups, one for each sentiment it has
export const unflattenRecommendations = (
  flatRecommendations: RawPassageType[],
  allSentiments: string[],
): PassageGroupsType => {
  const recommendations: PassageGroupsType = [];
  flatRecommendations.forEach((rec: RawPassageType) => {
    rec.tags.forEach(({sentiment}) => {
      const cleanedRec = {
        ...rec,
        tags: rec.tags.filter(({sentiment: s}) => allSentiments.includes(s)),
      };

      if (!allSentiments.includes(sentiment)) {
        return;
      }

      let passageGroup = recommendations.find(
        ({groupKey}) => groupKey === sentiment,
      )?.passageGroup;
      if (passageGroup == null) {
        passageGroup = [];
        recommendations.push({
          groupKey: sentiment,
          passageGroup,
        });
      }

      passageGroup.push({
        passageKey: getPassageId(cleanedRec),
        passage: cleanedRec,
      });
    });
  });
  return recommendations;
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
  const cacheImageDataForUrls = useCacheImageDataForUrls();

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
    const horoscope = data.horoscope as string;
    const likes = (data.likes || {}) as {[passageId: string]: boolean};
    const inferredLikes = flatRecommendations.map(r => {
      const passageId = getPassageId(r);
      return {
        [passageId]: likes[passageId] ?? false,
      };
    });

    const activeGroupKey = flatSentiments[0];

    updateImpressions({deviceId, passages: flatRecommendations});
    await cacheImageDataForUrls(
      flatRecommendations.map(({song}) => song.album.image),
    );

    const recommendations = unflattenRecommendations(
      flatRecommendations,
      flatSentiments,
    );

    dispatch(initPassageGroups(flatSentiments));
    dispatch(addLoadedPassageGroups(recommendations));

    dispatch(setSentimentGroups(sentimentGroups));

    dispatch(
      setActivePassage({
        groupKey: activeGroupKey,
        passageKey: getPassageId(flatRecommendations[0]),
      }),
    );

    dispatch(setHoroscope(horoscope || ''));

    dispatch(initLikes());
    dispatch(addLikes(Object.assign({}, ...inferredLikes)));

    return true;
  };

  return setupRecommendations;
};
