import React from 'react';
import PassageItem from '../passageItem/PassageItem';
import {PassageItemScreenProps} from '../../types/navigation';
import ThemeBackground from '../common/ThemeBackground';
import {Dimensions, StyleSheet, View} from 'react-native';

const PassageItemScreen = ({route}: PassageItemScreenProps) => {
  const {passage, theme} = route.params;

  const width = Dimensions.get('window').width * 0.85;
  const maxHeight = Dimensions.get('window').height * 0.8;

  return (
    <ThemeBackground theme={theme} style={styles.background}>
      <View style={{...styles.container, width, maxHeight}}>
        <PassageItem passage={passage} passageTheme={theme} />
      </View>
    </ThemeBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    justifyContent: 'center',
  },
  container: {
    alignSelf: 'center',
    flex: 1,
  },
});

export default PassageItemScreen;
