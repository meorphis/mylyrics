import {useState} from 'react';
import {RequestType} from '../../types/request';
import UserType from '../../types/user';
import db from './firestore';
import {useDeviceId} from '../device_id';
import {collection, doc, getDoc, onSnapshot} from '@firebase/firestore';

// Returns a function to get make a request along with the result of that request;
// the request gets the user's settings data from the database
export const useUserRequest = () => {
  const [userRequest, setUserRequest] = useState<RequestType<UserType>>({
    status: 'init',
  });

  const deviceId = useDeviceId();

  const makeUserRequest = async () => {
    setUserRequest({status: 'loading'});

    // keep the user's settings up to date
    onSnapshot(doc(collection(db, 'users'), deviceId), d => {
      setUserRequest({
        status: 'loaded',
        data: {
          hasSpotifyAuth: d.data()?.spotifyAuth != null,
        },
      });
    });

    const docSnap = await getDoc(doc(collection(db, 'users'), deviceId));
    setUserRequest({
      status: 'loaded',
      data: {
        hasSpotifyAuth: docSnap.data()?.spotifyAuth != null,
      },
    });
  };

  return {userRequest, makeUserRequest};
};
