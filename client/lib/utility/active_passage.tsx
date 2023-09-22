import {useDispatch, useSelector} from 'react-redux';
import {setActivePassage as setActivePassageRedux} from './redux/active_passage';
import {PassageGroupType, PassageType} from '../types/passage';
import {getPassageId} from './passage_id';
import {useThemeUpdate} from './theme';
import {useShareablePassageUpdate} from './shareable_passage';
import {RootState} from './redux';
import _ from 'lodash';
import {useSingletonPassageUpdate} from './singleton_passage';

export const useSetActivePassageRaw = () => {
  const dispatch = useDispatch();
  const {setThemeInfo} = useThemeUpdate();
  const {setShareablePassage} = useShareablePassageUpdate();

  return ({
    passageKey,
    groupKey,
    passages,
  }: {
    passageKey: string | null;
    groupKey: string;
    passages: PassageGroupType;
  }) => {
    dispatch(
      setActivePassageRedux({
        groupKey,
        passageKey,
      }),
    );

    let passageIndex;
    let prevPassage: PassageType | null = null;
    let passage: PassageType | null = null;
    let nextPassage: PassageType | null = null;

    if (passages.length > 0) {
      passageIndex = passageKey
        ? passages.findIndex(p => p.passageKey === passageKey)
        : 0;

      if (passageIndex !== -1) {
        const prevIndex =
          passageIndex === 0 ? passages.length - 1 : passageIndex - 1;
        const nextIndex =
          passageIndex === passages.length - 1 ? 0 : passageIndex + 1;

        prevPassage = passages[prevIndex].passage;
        passage = passages[passageIndex].passage;
        nextPassage = passages[nextIndex].passage;
      }
    }

    if (passageIndex != null && prevPassage && passage && nextPassage) {
      setThemeInfo({
        theme: passage.theme,
        groupThemeInfo: {
          groupKey,
          groupLength: passages.length,
          passageIndex,
          themes: passages.map(p => p.passage.theme),
        },
      });

      console.log('set shareable passage');

      setShareablePassage({
        passage,
      });
    }
  };
};

export const useSetActivePassage = ({groupKey}: {groupKey: string}) => {
  const setActivePassageRaw = useSetActivePassageRaw();

  const passages = useSelector(
    (state: RootState) => {
      if (groupKey === 'likes') {
        const likes = state.recentLikes;
        return likes
          .filter(l => l.isLiked)
          .map(l => ({
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
    (a, b) =>
      _.isEqual(
        a.map(p => p.passageKey),
        b.map(p => p.passageKey),
      ),
  );

  return ({passageKey}: {passageKey: string | null}) => {
    setActivePassageRaw({
      groupKey,
      passageKey,
      passages,
    });
  };
};

export const useSetActiveGroup = ({groupKey}: {groupKey: string}) => {
  const setActivePassage = useSetActivePassage({groupKey});
  const {unsetSingletonPassage} = useSingletonPassageUpdate();

  const activePassageKey = useSelector((state: RootState) => {
    return state.activePassage.groupKeyToPassageKey[groupKey];
  });

  return () => {
    console.log('setting active group', groupKey, activePassageKey);

    if (groupKey !== 'singleton_passage') {
      unsetSingletonPassage();
    }
    setActivePassage({passageKey: activePassageKey});
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

    const ret =
      state.activePassage.groupKeyToPassageKey[
        state.activePassage.activeGroupKey
      ] === passageKey;

    return ret;
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

export const useIsActiveGroup = (groupKey: string) => {
  return useSelector((state: RootState) => {
    return state.activePassage.activeGroupKey === groupKey;
  });
};
