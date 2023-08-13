import {getPermissionsAsync, requestPermissionsAsync} from 'expo-notifications';
import {useEffect, useState} from 'react';

export const useNotifications = () => {
  const [notificationStatus, setNotificationStatus] = useState('undetermined');

  const getPermissions = async () => {
    const {status} = await getPermissionsAsync();
    if (status === 'granted') {
      setNotificationStatus(status);
    } else {
      const {status: newStatus} = await requestPermissionsAsync();
      setNotificationStatus(newStatus);
    }
  };

  useEffect(() => {
    getPermissions();
  });

  return notificationStatus;
};
