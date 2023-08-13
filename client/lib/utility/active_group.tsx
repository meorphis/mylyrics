import {useDispatch, useSelector} from 'react-redux';
import {RootState} from './redux';
import {setActivePassage} from './redux/active_passage';
import {
  applyLoadedPassageGroups,
  markPassageGroupAsError,
  markPassageGroupAsLoading,
} from './redux/recommendations';
import {errorToString} from './error';
import {PassageItemKeyType, RawPassageType} from '../types/passage';
import {useDeviceId} from './device_id';
import {unflattenRecommendations} from './db/recommendations';
import {addImageDataToPassage} from './images';
import {API_HOST} from './api';

export const useSetAsActiveGroup = (passage: PassageItemKeyType) => {
  const passageGroupKeyIsUninitialized = useSelector(
    (state: RootState) =>
      state.recommendations.find(({groupKey}) => groupKey === passage.groupKey)
        ?.passageGroupRequest.status === 'init',
  );

  const deviceId = useDeviceId();

  const dispatch = useDispatch();

  const setActiveGroup = async () => {
    const {groupKey} = passage;

    dispatch(setActivePassage(passage));

    if (passageGroupKeyIsUninitialized) {
      dispatch(
        markPassageGroupAsLoading({
          groupKey,
        }),
      );
      try {
        const recommendationsResponse = await fetch(
          `${API_HOST}/get_additional_recommendations?userId=${deviceId}&sentiment=${groupKey}`,
        );
        const data = await recommendationsResponse.json();
        const rawFlatRecommendations = data.recommendations as RawPassageType[];
        const flatRecommendations = await Promise.all(
          rawFlatRecommendations.map(addImageDataToPassage),
        );
        const recommendations = unflattenRecommendations(flatRecommendations);
        dispatch(applyLoadedPassageGroups(recommendations));
      } catch (e) {
        dispatch(
          markPassageGroupAsError({
            groupKey,
            error: errorToString(e),
          }),
        );
      }
    }
  };

  return setActiveGroup;
};
