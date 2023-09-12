import React from 'react';
import {PassageItemScreenProps} from '../../types/navigation';
import ThemeBackground from '../common/ThemeBackground';
import {Dimensions, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import BottomBar from '../common/BottomBar';
import {ThemeProvider} from '../../utility/theme';
import {CAROUSEL_MARGIN_TOP} from './PassageItemCarousel';
import {SharablePassageProvider} from '../../utility/shareable_passage';
import ShareBottomSheet from './ShareBottomSheet';
import ScaleProviderPassageItem from './ScaleProviderPassageItem';

const PassageItemScreen = ({route}: PassageItemScreenProps) => {
  const {passage, theme} = route.params;

  const width = Dimensions.get('window').width * 0.85;
  const maxHeight = Dimensions.get('window').height * 0.85;

  return (
    <ThemeProvider initialTheme={theme}>
      <SharablePassageProvider>
        <ThemeBackground theme={theme}>
          <SafeAreaView style={{...styles.safearea}}>
            <View style={{...styles.container, width, maxHeight}}>
              <ScaleProviderPassageItem
                passage={passage}
                passageTheme={theme}
              />
            </View>
            <BottomBar activeGroupKey={null} style={styles.bottomBar} />
          </SafeAreaView>
          <ShareBottomSheet />
        </ThemeBackground>
      </SharablePassageProvider>
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
    alignSelf: 'center',
    bottom: 0,
    marginTop: 12,
  },
});

export default PassageItemScreen;
