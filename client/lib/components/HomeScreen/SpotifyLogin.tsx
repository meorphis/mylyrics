import {useDeviceId} from '../../utility/contexts/device_id';
import React, {memo} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import IconButton from '../common/IconButton';
import AppearingView from '../common/AppearingView';
import {textStyleCommon} from '../../utility/helpers/text';
const spotifyIcon = require('../../assets/spotify_icon_white.png');

type Props = {
  handleSpotifyLogin: ({deviceId}: {deviceId: string}) => Promise<void>;
};

const SpotifyLogin = (props: Props) => {
  console.log('rendering SpotifyLogin');

  const {handleSpotifyLogin} = props;
  const deviceId = useDeviceId();

  return (
    <View style={styles.container}>
      <AppearingView duration={1000}>
        <IconButton
          style={styles.spotifyButton}
          textStyle={styles.spotifyButtonText}
          onPress={() => handleSpotifyLogin({deviceId})}
          icon={<Image source={spotifyIcon} style={styles.spotifyIcon} />}
          text="connect with spotify"
        />
      </AppearingView>
      <AppearingView
        delay={1000}
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    paddingLeft: 16,
    paddingRight: 24,
    alignSelf: 'center',
    marginBottom: 12,
    height: 64,
    borderRadius: 32,
  },
  spotifyButtonText: {
    fontSize: 20,
  },
  spotifyIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  commentaryContainer: {
    maxWidth: '80%',
  },
  commentaryText: {
    marginTop: 12,
    fontSize: 20,
    color: '#333333',
    textAlign: 'center',
  },
});

export default memo(SpotifyLogin, () => true);
