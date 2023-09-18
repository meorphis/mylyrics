import {useDispatch, useSelector} from 'react-redux';
import {setActivePassage as setActivePassageRedux} from './redux/active_passage';
import {PassageGroupType, PassageType} from '../types/passage';
import {getPassageId} from './passage_id';
import {useThemeUpdate} from './theme';
import {useShareablePassageUpdate} from './shareable_passage';
import {RootState} from './redux';
import _ from 'lodash';

export const useSetActivePassage = () => {
  const dispatch = useDispatch();
  const updateGlobalTheme = useThemeUpdate();
  const {setShareablePassage} = useShareablePassageUpdate();

  return ({groupKey, passage}: {passage?: PassageType; groupKey?: string}) => {
    const passageKey = passage ? getPassageId(passage) : null;

    dispatch(setActivePassageRedux({groupKey, passageKey}));

    if (passage) {
      updateGlobalTheme(passage.theme);

      setTimeout(() => {
        setShareablePassage(passage);
      }, 100);
    }
  };
};

export const useSetActiveGroup = ({groupKey}: {groupKey: string}) => {
  const setActivePassage = useSetActivePassage();

  const passages = useSelector(
    (state: RootState) => {
      if (groupKey === 'likes') {
        const likes = state.recentLikes;
        return likes.map(l => ({
          passageKey: getPassageId(l.passage),
          passage: l.passage,
        })) as PassageGroupType;
      }

      const group = state.recommendations.find(r => r.groupKey === groupKey);
      if (group) {
        return group.passageGroupRequest.data;
      }

      return [];
    },
    (a, b) => _.isEqual(Object.keys(a), Object.keys(b)),
  );

  const activePassageKey = useSelector((state: RootState) => {
    return state.activePassage.groupKeyToPassageKey[groupKey];
  });

  return () => {
    const passage =
      passages.find(p => p.passageKey === activePassageKey)?.passage ??
      passages[0].passage;

    console.log(`setting active passage for ${groupKey} ${passage.song.name}`);

    if (passage) {
      setActivePassage({passage, groupKey});
    }
  };
};

export const useIsActivePassage = ({
  groupKey,
  passageKey,
}: {
  groupKey?: string;
  passageKey: string;
}) => {
  return useSelector((state: RootState) => {
    if (state.activePassage.activeGroupKey == null) {
      return false;
    }

    if (groupKey != null && state.activePassage.activeGroupKey !== groupKey) {
      return false;
    }

    return (
      state.activePassage.groupKeyToPassageKey[
        state.activePassage.activeGroupKey
      ] === passageKey
    );
  });
};

export const useActiveGroupKey = () => {
  const groupKey = useSelector((state: RootState) => {
    return state.activePassage.activeGroupKey;
  });

  if (groupKey == null) {
    throw new Error('active group key is null');
  }

  return groupKey;
};
