import {useState} from 'react';
import {useDeviceId} from '../device_id';
import db from './firestore';
import {doc, collection, getDoc} from '@firebase/firestore';
import {RequestType} from '../../types/request';
import {useDispatch} from 'react-redux';
import {applyLoadedPassageGroups} from '../redux/recommendations';
import {errorToString} from '../error';
import {setActivePassage} from '../redux/active_passage';
import {PassageGroupsType, PassageType} from '../../types/passage';

export const useRecommendationsRequest = () => {
  const [recommendationsRequest, setRecommendationsRequest] = useState<
    RequestType<null>
  >({
    status: 'init',
  });

  const deviceId = useDeviceId();
  const dispatch = useDispatch();

  const makeRecommendationsRequest = async () => {
    setRecommendationsRequest({status: 'loading'});

    try {
      const docSnap = await getDoc(
        doc(collection(db, 'user-recommendations'), deviceId),
      );

      if (docSnap.exists()) {
        const data = docSnap.data();
        const activeGroupKey = data.sentiment;
        const flatRecommendations = data.recommendations;
        const recommendations = unflattedRecommendations(flatRecommendations);

        dispatch(applyLoadedPassageGroups(recommendations));

        dispatch(
          setActivePassage({
            groupKey: activeGroupKey,
            passageKey: flatRecommendations[0].song.name,
          }),
        );

        setRecommendationsRequest({
          status: 'loaded',
          data: null,
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

export const unflattedRecommendations = (
  flatRecommendations: PassageType[],
): PassageGroupsType => {
  const recommendations: PassageGroupsType = [];
  flatRecommendations.forEach((rec: PassageType) => {
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
