import {useState} from 'react';
import {useDeviceId} from '../device_id';
import db from './firestore';
import {doc, collection, getDoc} from '@firebase/firestore';
import {RequestType} from '../../types/request';
import {useDispatch} from 'react-redux';
import {applyLoadedPassageGroups} from '../redux/recommendations';
import {errorToString} from '../error';
import {setActivePassage} from '../redux/active_passage';
import {PassageGroupsType, RawPassageType} from '../../types/passage';
import {useCacheImageDataForUrls} from '../images';

// Returns a function to get make a request along with the result of that request;
// the request gets the user's recommendations from the database fetches image data
// for each recommendation, and dispatches the data to the redux store;
// recommendationsRequest.data is true if recommendations were found, false otherwise
export const useRecommendationsRequest = () => {
  const [recommendationsRequest, setRecommendationsRequest] = useState<
    RequestType<boolean>
  >({
    status: 'init',
  });

  const deviceId = useDeviceId();
  const dispatch = useDispatch();
  const cacheImageDataForUrls = useCacheImageDataForUrls();

  const makeRecommendationsRequest = async () => {
    setRecommendationsRequest({status: 'loading'});

    try {
      const docSnap = await getDoc(
        doc(collection(db, 'user-recommendations'), deviceId),
      );

      if (docSnap.exists()) {
        const data = docSnap.data();
        const activeGroupKey = data.sentiment;
        const flatRecommendations = data.recommendations as RawPassageType[];
        const recommendations = unflattenRecommendations(flatRecommendations);

        await cacheImageDataForUrls(
          flatRecommendations.map(({song}) => song.album.image),
        );

        dispatch(applyLoadedPassageGroups(recommendations));

        dispatch(
          setActivePassage({
            groupKey: activeGroupKey,
            passageKey: flatRecommendations[0].song.name,
          }),
        );

        setRecommendationsRequest({
          status: 'loaded',
          data: true,
        });
      } else {
        setRecommendationsRequest({
          status: 'loaded',
          data: false,
        });
      }
    } catch (e) {
      setRecommendationsRequest({
        status: 'error',
        error: errorToString(e),
      });
    }
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
): PassageGroupsType => {
  const recommendations: PassageGroupsType = [];
  flatRecommendations.forEach((rec: RawPassageType) => {
    rec.tags.forEach(({sentiment}) => {
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
        passageKey: rec.song.name,
        passage: rec,
      });
    });
  });
  return recommendations;
};
