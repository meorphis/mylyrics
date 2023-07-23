import {useState} from 'react';
import {useDeviceId} from '../device_id';
import db from './firestore';
import {doc, collection, getDoc} from '@firebase/firestore';
import {RequestType} from '../../types/request';
import {useDispatch} from 'react-redux';
import {applyLoadedPassageGroups} from '../redux/recommendations';
import {errorToString} from '../error';

export const useRecommendationsRequest = () => {
  const [recommendationsRequest, setRecommendationsRequest] = useState<
    RequestType<null>
  >({
    status: 'init',
  });

  const deviceId = useDeviceId();
  const dispatch = useDispatch();

  const makeRecommendationsRequest = async () => {
    setRecommendationsRequest({status: 'loading'});

    try {
      const docSnap = await getDoc(doc(collection(db, 'users'), deviceId));

      if (docSnap.exists()) {
        const data = docSnap.data();

        dispatch(applyLoadedPassageGroups(data.recommendations));

        setRecommendationsRequest({
          status: 'loaded',
          data: null,
        });
      } else {
        setRecommendationsRequest({
          status: 'loaded',
          data: null,
        });
      }
    } catch (e) {
      setRecommendationsRequest({
        status: 'error',
        error: errorToString(e),
      });
    }
  };

  return {
    recommendationsRequest,
    makeRecommendationsRequest,
  };
};
