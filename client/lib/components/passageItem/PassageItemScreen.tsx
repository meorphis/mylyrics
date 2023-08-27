import React from 'react';
import {
  PassageItemScreenProps,
  RootStackParamList,
} from '../../types/navigation';
import ThemeBackground from '../common/ThemeBackground';
import {Dimensions, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CAROUSEL_MARGIN_TOP} from '../recommendations/PassageGroupCarousel';
import BottomBar from '../common/BottomBar';
import {ThemeProvider} from '../../utility/theme';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import ViewShotPassageItem from './ViewShotPassageItem';

const PassageItemScreen = ({route}: PassageItemScreenProps) => {
  const {passage, theme} = route.params;

  const width = Dimensions.get('window').width * 0.85;
  const maxHeight = Dimensions.get('window').height * 0.85;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <ThemeProvider initialTheme={theme}>
      <ThemeBackground theme={theme}>
        <SafeAreaView style={{...styles.safearea}}>
          <View style={{...styles.container, width, maxHeight}}>
            <ViewShotPassageItem passage={passage} passageTheme={theme} />
          </View>
          <BottomBar
            activeGroupKey={null}
            onGroupSelected={() => {
              navigation.navigate('Main');
            }}
            style={styles.bottomBar}
          />
        </SafeAreaView>
      </ThemeBackground>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  safearea: {
    marginTop: CAROUSEL_MARGIN_TOP,
    flex: 1,
  },
  container: {
    flex: 1,
    alignSelf: 'center',
  },
  bottomBar: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 0,
  },
});

export default PassageItemScreen;
