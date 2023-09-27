import {useDeviceId} from '../../utility/contexts/device_id';
import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import IconButton from '../common/IconButton';
import AppearingView from '../common/AppearingView';
import {textStyleCommon} from '../../utility/helpers/text';

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
      <AppearingView
        delay={500}
        duration={1000}
        style={styles.commentaryContainer}>
        <Text style={{...textStyleCommon, ...styles.commentaryText}}>
          this app only works if you connect with spotify
        </Text>
      </AppearingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  spotifyButton: {
    backgroundColor: '#1DB954',
    paddingLeft: 16,
    paddingRight: 24,
    alignSelf: 'center',
    marginBottom: 12,
  },
  spotifyIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  commentaryContainer: {
    maxWidth: '80%',
  },
  commentaryText: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
  },
});

export default SpotifyLogin;
