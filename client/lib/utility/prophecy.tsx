import {useState} from 'react';
import {PassageType} from '../types/passage';
import {RequestType} from '../types/request';
import {API_HOST} from './api';
import {useDeviceId} from './device_id';
import {useDispatch} from 'react-redux';
import {setProphecy} from './redux/prophecy';

export const useProphecyRequest = () => {
  const deviceId = useDeviceId();
  const dispatch = useDispatch();

  const [request, setRequest] = useState<RequestType<null>>({status: 'init'});

  const makeProphecyRequest = async (passages: PassageType[]) => {
    setRequest({status: 'loading'});

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
      setRequest({status: 'error', error: response.statusText});
      return;
    }

    console.log('response', response);

    const data = await response.json();
    dispatch(setProphecy(data.prophecy));
    setRequest({status: 'loaded', data: null});
  };

  return {status: request.status, makeProphecyRequest};
};
