import {useState} from 'react';
import {PassageType} from '../../types/passage';
import {RequestStatus} from '../../types/request';
import {API_HOST} from '../config/api';
import {useDeviceId} from '../contexts/device_id';
import {useDispatch} from 'react-redux';
import {setProphecy} from '../redux/prophecy/slice';

// returns a function that gets a prophecy from the server and puts it in redux,
// along with the result of that request
export const useProphecyRequest = () => {
  const deviceId = useDeviceId();
  const dispatch = useDispatch();

  const [requestStatus, setRequestStatus] = useState<RequestStatus>('init');

  const makeProphecyRequest = async (passages: PassageType[]) => {
    setRequestStatus('loading');

    const response = await fetch(`${API_HOST}/get_prophecy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: deviceId,
        passages: passages,
      }),
    });

    if (!response.ok) {
      setRequestStatus('error');
      return;
    }

    const data = await response.json();
    dispatch(setProphecy(data.prophecy));
    setRequestStatus('loaded');
  };

  return {requestStatus, makeProphecyRequest};
};
