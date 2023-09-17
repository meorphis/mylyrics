import React from 'react';
import {PassageItemScreenProps} from '../../types/navigation';
import ThemeBackground from '../common/ThemeBackground';
import {Dimensions, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import BottomBar from '../common/BottomBar';
import {ThemeProvider} from '../../utility/theme';
import {CAROUSEL_MARGIN_TOP} from './PassageItemCarousel';
import ShareBottomSheet from './ShareBottomSheet/ShareBottomSheet';
import CarouselPassageItem from './SelectedPassageItem';

const PassageItemScreen = ({route}: PassageItemScreenProps) => {
  const {passage, theme} = route.params;

  const width = Dimensions.get('window').width * 0.85;
  const maxHeight = Dimensions.get('window').height * 0.85;

  return (
    <ThemeProvider initialTheme={theme}>
      <ThemeBackground theme={theme}>
        <SafeAreaView style={{...styles.container, width, maxHeight}}>
          <CarouselPassageItem passage={passage} passageIsActive />
        </SafeAreaView>
        <BottomBar activeGroupKey={null} style={styles.bottomBar} />
        <ShareBottomSheet />
      </ThemeBackground>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: CAROUSEL_MARGIN_TOP,
    marginHorizontal: 24,
    flex: 1,
  },
  bottomBar: {
    alignSelf: 'center',
    bottom: 0,
    marginTop: 12,
  },
});

export default PassageItemScreen;
