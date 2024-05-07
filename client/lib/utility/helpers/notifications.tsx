import {
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications';
import {useEffect, useState} from 'react';

// requests permissions from the user to send push notifications if permissions
// have not been determined yet and returns the current status of permissions
// and the expo push token
export const useNotifications = () => {
  const [notificationStatus, setNotificationStatus] = useState('undetermined');
  const [expoPushToken, setExpoPushToken] = useState('');

  const setPermissions = async () => {
    const {status} = await getPermissionsAsync();
    if (status === 'granted') {
      setNotificationStatus(status);
    } else {
      const {status: newStatus} = await requestPermissionsAsync();
      setNotificationStatus(newStatus);
    }
  };

  const setPushToken = async () => {
    const pushToken = (
      await getExpoPushTokenAsync({
        projectId: '9f10108c-729e-4e2d-97e0-9cf2b8b06ff4',
      })
    ).data;
    setExpoPushToken(pushToken);
  };

  useEffect(() => {
    setPermissions();
  });

  useEffect(() => {
    if (notificationStatus === 'granted') {
      setPushToken();
    }
  }, [notificationStatus]);

  return {notificationStatus, expoPushToken};
};

// export const useNotificationHandlers = () => {
//   const dispatch = useDispatch();

//   useEffect(() => {
//     const subscription = addNotificationResponseReceivedListener(() => {
//       console.log('notification clicked!')
//       dispatch(requestAutoflip())
//     });
//     return () => subscription.remove();
//   }, []);
// }
