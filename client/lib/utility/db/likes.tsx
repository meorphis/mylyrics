import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  where,
} from '@firebase/firestore';
import {PassageType} from '../../types/passage';
import db from './firestore';
import {v5 as uuidv5} from 'uuid';
import {useDeviceId} from '../device_id';
import {RequestType, RequestTypeWithPartial} from '../../types/request';
import {useEffect, useState} from 'react';
import {RootState} from '../redux';
import {useDispatch, useSelector} from 'react-redux';
import {getPassageId} from '../passage_id';
import {addRecentLikes, removeRecentLike} from '../redux/recent_likes';

const getLikeId = (deviceId: string, passage: PassageType): string => {
  return uuidv5(
    deviceId + getPassageId(passage),
    '450e0e22-a68f-46bf-a413-e23cfbd11072',
  );
};

export const useLikeRequest = (passage: PassageType) => {
  const deviceId = useDeviceId();
  const dispatch = useDispatch();

  const isRecentlyLiked = useSelector((state: RootState) => {
    const likeData = state.recentLikes.find(
      like => getPassageId(like.passage) === getPassageId(passage),
    );

    return likeData?.isLiked ?? null;
  });

  let initialState: RequestTypeWithPartial<boolean> = {
    status: 'loading',
    data: false,
  };

  const [request, setRequest] =
    useState<RequestTypeWithPartial<boolean>>(initialState);

  useEffect(() => {
    if (isRecentlyLiked != null) {
      setRequest({
        status: 'loaded',
        data: isRecentlyLiked,
      });
    }
  }, [isRecentlyLiked]);

  useEffect(() => {
    const load = async () => {
      const d = await getDoc(
        doc(db, 'user-likes', getLikeId(deviceId, passage)),
      );

      if (d.exists()) {
        setRequest({
          status: 'loaded',
          data: true,
        });
      } else {
        setRequest({
          status: 'loaded',
          data: false,
        });
      }
    };

    if (isRecentlyLiked == null) {
      load();
    }
  }, []);

  const toggleLike = async () => {
    if (request.status === 'loading') {
      throw new Error('Cannot toggle like while loading');
    }

    const now = Date.now();

    const oldState = request.data;
    // optimistically update state
    setRequest({
      status: 'loaded',
      data: !oldState,
    });

    // update local state
    if (oldState) {
      dispatch(removeRecentLike(passage));
    } else {
      dispatch(
        addRecentLikes([
          {
            passage: passage,
            timestamp: now,
          },
        ]),
      );
    }

    // update database
    await runTransaction(db, async transaction => {
      if (oldState) {
        transaction.delete(doc(db, 'user-likes', getLikeId(deviceId, passage)));
      } else {
        transaction.set(doc(db, 'user-likes', getLikeId(deviceId, passage)), {
          deviceId,
          passageId: getPassageId(passage),
          passage: passage,
          timestamp: now,
        });
      }
    });
  };

  console.log(
    `passage: ${passage.song.name}, isRecentlyLiked: ${request.data}`,
  );

  return {request, toggleLike};
};

export const useRecentLikesRequest = () => {
  const deviceId = useDeviceId();
  const dispatch = useDispatch();

  const [request, setRequest] = useState<RequestType<null>>({
    status: 'loading',
  });

  const makeRequest = async () => {
    try {
      const ref = collection(db, 'user-likes');
      const d = query(
        ref,
        where('deviceId', '==', deviceId),
        orderBy('timestamp', 'desc'),
        limit(20),
      );

      const snapshot = await getDocs(d);

      const likes = snapshot.docs.map(entry => {
        return {
          passage: entry.data().passage,
          timestamp: entry.data().timestamp,
        };
      });

      dispatch(addRecentLikes(likes));

      setRequest({
        status: 'loaded',
        data: null,
      });
    } catch (e) {
      setRequest({
        status: 'error',
        error: (e as Error).message,
      });
      console.log((e as Error).message);
    }
  };

  return {request, makeRequest};
};
