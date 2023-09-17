import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {RecentLike} from '../../types/likes';
import {getPassageId} from '../passage_id';
import {PassageType} from '../../types/passage';

type RecentLikeData = RecentLike & {
  isLiked: boolean;
};

export const recentLikesSlice = createSlice({
  name: 'recent_likes',
  initialState: [] as RecentLikeData[],
  reducers: {
    addRecentLikes: (
      state: RecentLikeData[],
      action: PayloadAction<RecentLike[]>,
    ) => {
      return [
        ...state,
        ...action.payload
          .filter(
            l =>
              !state.find(
                sl => getPassageId(sl.passage) === getPassageId(l.passage),
              ),
          )
          .map(l => {
            return {...l, isLiked: true};
          }),
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
    },
    removeRecentLike: (
      state: RecentLikeData[],
      action: PayloadAction<PassageType>,
    ) => {
      const like = state.find(
        l => getPassageId(l.passage) === getPassageId(action.payload),
      );
      if (like) {
        like.isLiked = false;
      }
    },
  },
});

export const {addRecentLikes, removeRecentLike} = recentLikesSlice.actions;

export default recentLikesSlice.reducer as Reducer<RecentLikeData[]>;
