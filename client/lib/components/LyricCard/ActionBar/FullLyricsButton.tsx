import React from 'react';
import ActionBarButton from './ActionBarButton';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../types/navigation';
import {getDefaultCustomizationForPassage} from '../../../utility/helpers/theme';
import {PassageType} from '../../../types/passage';
import {useLyricCardSize} from '../../../utility/helpers/lyric_card';

type Props = {
  passage: PassageType;
  sharedTransitionKey: string;
};

// button to navigate to the FullLyrics screen displaying the full lyrics of the
// song that the passage is from
const FullLyricsButton = (props: Props) => {
  const {passage, sharedTransitionKey} = props;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    deckMarginTop: lyricCardDeckMarginTop,
    itemMarginTop: lyricCardMarginTop,
  } = useLyricCardSize();

  return (
    <ActionBarButton
      onPress={() => {
        navigation.navigate('FullLyrics', {
          customizablePassage: {
            passage,
            customization: getDefaultCustomizationForPassage(passage),
          },
          lyricCardMeasurementContext: 'MAIN_SCREEN',
          lyricsYPositionOffset: lyricCardDeckMarginTop + lyricCardMarginTop,
          sharedTransitionKey,
          onSelect: 'ADD_SINGLETON_PASSAGE',
        });
      }}
      theme={passage.theme}
      defaultState={{
        icon: 'expand',
        IconClass: MaterialIcon,
        text: 'full lyrics',
      }}
    />
  );
};

export default FullLyricsButton;
