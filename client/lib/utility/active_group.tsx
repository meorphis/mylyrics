import {useDispatch, useSelector} from 'react-redux';
import {RootState} from './redux';
import {setActivePassage} from './redux/active_passage';
import {
  applyLoadedPassageGroups,
  markPassageGroupAsError,
  markPassageGroupAsLoading,
} from './redux/recommendations';

export const useActiveGroup = (groupKey: string) => {
  const isActiveGroup = useSelector(
    (state: RootState) => state.activePassage?.groupKey === groupKey,
  );
  const passageGroupDataStatus = useSelector(
    (state: RootState) => state.recommendations[groupKey]?.status || 'init',
  );

  const dispatch = useDispatch();

  const setActiveGroup = async ({passageKey}: {passageKey?: string}) => {
    dispatch(
      setActivePassage({
        passageKey,
        groupKey,
      }),
    );

    if (passageGroupDataStatus === 'init') {
      dispatch(
        markPassageGroupAsLoading({
          groupKey,
        }),
      );
      try {
        const recommendationsResponse = await fetch(
          `http://172.20.10.3:3000?groupKey=${groupKey}`,
        );
        const recommendations = await recommendationsResponse.json();
        dispatch(applyLoadedPassageGroups(recommendations));
      } catch (e) {
        dispatch(
          markPassageGroupAsError({
            groupKey,
            error: e as Error,
          }),
        );
      }
    }
  };

  return {
    isActiveGroup,
    setActiveGroup,
  };
};
