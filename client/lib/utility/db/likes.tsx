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
import {PassageType, RawPassageType} from '../../types/passage';
import db from './firestore';
import {v5 as uuidv5} from 'uuid';
import {useDeviceId} from '../contexts/device_id';
import {RequestType, RequestTypeWithPartial} from '../../types/request';
import {useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {useBundleIncludesPassage} from '../redux/bundles/selectors';
import {
  addBundles,
  addToBundle,
  removeFromBundle,
} from '../redux/bundles/slice';
import {dehydratePassage, getPassageId} from '../helpers/passage';
import {getThemeFromAlbumColors} from '../helpers/theme';
import {BundlePassageType} from '../../types/bundle';

const getLikeId = (deviceId: string, passage: PassageType): string => {
  return uuidv5(
    deviceId + passage.passageKey,
    '450e0e22-a68f-46bf-a413-e23cfbd11072',
  );
};

export const useLikeRequest = (passage: PassageType) => {
  const deviceId = useDeviceId();
  const dispatch = useDispatch();

  const isRecentlyLiked = useBundleIncludesPassage({
    bundleKey: 'likes',
    passageKey: passage.passageKey,
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
      dispatch(
        removeFromBundle({
          bundleKey: 'likes',
          passageKey: passage.passageKey,
        }),
      );
    } else {
      dispatch(
        addToBundle({
          ...passage,
          bundleKey: 'likes',
          sortKey: now,
        }),
      );
    }

    // update database
    await runTransaction(db, async transaction => {
      if (oldState) {
        transaction.delete(doc(db, 'user-likes', getLikeId(deviceId, passage)));
      } else {
        transaction.set(doc(db, 'user-likes', getLikeId(deviceId, passage)), {
          deviceId,
          passageId: passage.passageKey,
          passage: dehydratePassage(passage),
          timestamp: now,
        });
      }
    });
  };

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

      const passages: BundlePassageType[] = snapshot.docs.map(entry => {
        const rawPassage: RawPassageType = entry.data().passage;
        return {
          ...rawPassage,
          passageKey: getPassageId(rawPassage),
          sortKey: entry.data().timestamp,
          bundleKey: 'likes',
          theme: getThemeFromAlbumColors(rawPassage.song.album.image.colors),
          hydrated: false,
        };
      });

      dispatch(
        addBundles([
          {
            info: {
              type: 'likes',
              key: 'likes',
              group: 'essentials',
            },
            passages,
            sortOrder: 'desc',
          },
        ]),
      );

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
