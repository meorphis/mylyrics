import {doc, getDoc, runTransaction} from '@firebase/firestore';
import {PassageType} from '../../types/passage';
import db from './firestore';
import {v5 as uuidv5} from 'uuid';
import {useDeviceId} from '../device_id';
import {RequestTypeWithPartial} from '../../types/request';
import {useEffect, useState} from 'react';
import {RootState} from '../redux';
import {useSelector} from 'react-redux';
import {getPassageId} from '../passage_id';

const getLikeId = (deviceId: string, passage: PassageType): string => {
  return uuidv5(
    deviceId + getPassageId(passage),
    '450e0e22-a68f-46bf-a413-e23cfbd11072',
  );
};

export const useLikeRequest = (passage: PassageType) => {
  const deviceId = useDeviceId();

  const likes = useSelector((state: RootState) => state.likes);

  const passageId = getPassageId(passage);

  let initialState: RequestTypeWithPartial<boolean> = {
    status: 'loading',
    data: false,
  };

  if (Object.keys(likes).includes(passageId)) {
    initialState = {
      status: 'loaded',
      data: likes[passageId],
    };
  }

  const [request, setRequest] =
    useState<RequestTypeWithPartial<boolean>>(initialState);

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

    if (request.status === 'loading') {
      load();
    }
  });

  const toggleLike = async () => {
    if (request.status === 'loading') {
      throw new Error('Cannot toggle like while loading');
    }

    const oldState = request.data;
    // optimistically update state
    setRequest({
      status: 'loaded',
      data: !oldState,
    });

    await runTransaction(db, async transaction => {
      if (oldState) {
        transaction.delete(doc(db, 'user-likes', getLikeId(deviceId, passage)));
      } else {
        transaction.set(doc(db, 'user-likes', getLikeId(deviceId, passage)), {
          passageId: getPassageId(passage),
          passage: passage,
          timestamp: Date.now(),
        });
      }
      transaction.set(
        doc(db, 'user-recommendations', deviceId),
        {
          likes: {
            [getPassageId(passage)]: !oldState,
          },
        },
        {merge: true},
      );
    });
  };

  return {request, toggleLike};
};
