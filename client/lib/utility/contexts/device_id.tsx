import React from 'react';
import {useEffect} from 'react';
import ShortUniqueId from 'short-unique-id';
import {useMMKVStorage} from 'react-native-mmkv-storage';
import {mmkvStorage} from '../config/local_storage';

// a provider component that loads or creates then provides a unique device
// id to its descendant; if the id is not yet available, the children will not
// be rendered
export const DeviceIdProvider = (props: {
  children: JSX.Element | JSX.Element[];
}) => {
  const [deviceId, setDeviceId] = useMMKVStorage<string>(
    'deviceId',
    mmkvStorage,
    undefined,
  );

  useEffect(() => {
    if (deviceId == null) {
      setDeviceId(
        new ShortUniqueId({
          dictionary: 'alphanum_upper',
          length: 10,
        }).randomUUID(),
      );
    }
  }, [deviceId]);

  if (deviceId == null) {
    return null;
  }

  return (
    <DeviceIdContext.Provider value={{deviceId}}>
      {props.children}
    </DeviceIdContext.Provider>
  );
};

// a hook that returns the device ID
export const useDeviceId = () => {
  const {deviceId} = React.useContext(DeviceIdContext)!;
  // assume it's not null because we'll only ever use this inside of a provider
  return deviceId!;
};

// *** PRIVATE HELPERS ***
const DeviceIdContext = React.createContext<{
  deviceId?: string;
}>({});
