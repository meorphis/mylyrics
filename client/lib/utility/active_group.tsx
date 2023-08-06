import {useDispatch, useSelector} from 'react-redux';
import {RootState} from './redux';
import {setActivePassage} from './redux/active_passage';
import {
  applyLoadedPassageGroups,
  markPassageGroupAsError,
  markPassageGroupAsLoading,
} from './redux/recommendations';
import {errorToString} from './error';
import {PassageItemKeyType} from '../types/passage';
import {useDeviceId} from './device_id';
import {unflattedRecommendations} from './db/recommendations';

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
          `https://9v121mddj3.execute-api.us-east-2.amazonaws.com/Prod?userId=${deviceId}&sentiment=${groupKey}`,
        );
        const data = await recommendationsResponse.json();
        const recommendations = unflattedRecommendations(data.recommendations);
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
