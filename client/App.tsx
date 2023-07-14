import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useSpotifyAuthentication } from './lib/spotify_auth';
import { DeviceIdProvider } from './lib/device_id';

export default function App() {
  return (
    <DeviceIdProvider>
      <AppInner />
    </DeviceIdProvider>
  );
}

function AppInner() {
  const [_, handleSpotifyLogin] = useSpotifyAuthentication();

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Button title="Connect with Spotify" onPress={() => handleSpotifyLogin()}></Button>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
