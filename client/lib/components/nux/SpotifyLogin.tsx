import {useDeviceId} from '../../utility/device_id';
import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import IconButton from '../common/IconButton';

type Props = {
  handleSpotifyLogin: ({deviceId}: {deviceId: string}) => Promise<void>;
};

const SpotifyLogin = (props: Props) => {
  const {handleSpotifyLogin} = props;
  const deviceId = useDeviceId();

  return (
    <View style={styles.container}>
      <IconButton
        style={styles.spotifyButton}
        onPress={() => handleSpotifyLogin({deviceId})}
        icon={
          <Image
            source={require('../../assets/spotify_icon_white.png')}
            style={styles.spotifyIcon}
          />
        }
        text="connect with spotify"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  spotifyButton: {
    backgroundColor: '#1DB954',
  },
  spotifyIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
});

export default SpotifyLogin;
