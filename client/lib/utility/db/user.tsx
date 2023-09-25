import {useState} from 'react';
import {RequestType} from '../../types/request';
import {UserType, SetUserType} from '../../types/user';
import db from './firestore';
import {useDeviceId} from '../contexts/device_id';
import {collection, doc, getDoc, onSnapshot, setDoc} from '@firebase/firestore';

// returns a function to get make a request along with the result of that request;
// the request gets the user's settings data from the database
export const useGetUserRequest = () => {
  const [getUserRequest, setUserRequest] = useState<RequestType<UserType>>({
    status: 'init',
  });

  const deviceId = useDeviceId();

  const makeGetUserRequest = async () => {
    setUserRequest({status: 'loading'});

    // keep the user's settings up to date
    onSnapshot(doc(collection(db, 'users'), deviceId), d => {
      setUserRequest({
        status: 'loaded',
        data: {
          hasSpotifyAuth: d.data()?.spotifyAuth != null,
          hasExpoPushToken: d.data()?.expoPushToken != null,
        },
      });
    });

    const docSnap = await getDoc(doc(collection(db, 'users'), deviceId));
    setUserRequest({
      status: 'loaded',
      data: {
        hasSpotifyAuth: docSnap.data()?.spotifyAuth != null,
        hasExpoPushToken: docSnap.data()?.expoPushToken != null,
      },
    });
  };

  return {getUserRequest, makeGetUserRequest};
};

export const useSetUserRequest = () => {
  const deviceId = useDeviceId();

  const setUserRequest = async (data: SetUserType) => {
    await setDoc(doc(db, 'users', deviceId), data, {merge: true});
  };

  return setUserRequest;
};
