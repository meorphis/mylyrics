import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {PassageType} from '../../../types/passage';
import ProphecyCard from './ProphecyCard';
import {textStyleCommon} from '../../../utility/text';
import ThemeType from '../../../types/theme';
import {getLyricsColor} from '../../../utility/lyrics';
import ThemeButton from '../ThemeButton';
import {ButtonColorChoice} from '../../../utility/color';
import {ScrollView} from 'react-native-gesture-handler';

type Props = {
  cards: PassageType[];
  theme: ThemeType;
  backgroundColor: string;
  onSubmit: () => void;
};

const ProphecyCardsView = (props: Props) => {
  const {cards, theme, backgroundColor, onSubmit} = props;

  const textColor = getLyricsColor({theme});

  return (
    <ScrollView style={styles.container}>
      <Text style={{...styles.titleText, ...textStyleCommon, color: textColor}}>
        🔮 your prophecy cards 🔮
      </Text>
      {cards.length < 3 && (
        <Text
          style={{
            ...styles.descriptionText,
            ...textStyleCommon,
            color: textColor,
          }}>
          draw three lyric cards to have your prophecy read
        </Text>
      )}

      {[0, 1, 2].map(index => {
        const card = cards[index];
        return (
          <ProphecyCard
            key={index}
            card={card}
            index={index}
            textColor={textColor}
            backgroundColor={backgroundColor}
          />
        );
      })}
      <ThemeButton
        theme={theme}
        style={styles.submitButton}
        text="read prophecy"
        colorChoice={ButtonColorChoice.detailSaturated}
        textStyle={styles.submitButtonText}
        onPress={() => {
          onSubmit();
        }}
        isDisabled={cards.length < 3}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 16,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '200',
    paddingBottom: 24,
    textAlign: 'center',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 16,
    padding: 8,
  },
});

export default ProphecyCardsView;
