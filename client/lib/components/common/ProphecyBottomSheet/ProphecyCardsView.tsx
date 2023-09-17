import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {PassageType} from '../../../types/passage';
import ProphecyCard from './ProphecyCard';
import {textStyleCommon} from '../../../utility/text';
import ThemeButton from '../ThemeButton';
import {ScrollView} from 'react-native-gesture-handler';

type Props = {
  cards: PassageType[];
  backgroundColor: string;
  onSubmit: () => void;
};

const ProphecyCardsView = (props: Props) => {
  const {cards, backgroundColor, onSubmit} = props;

  const textColor = 'black';

  return (
    <ScrollView style={styles.container}>
      <Text style={{...textStyleCommon, ...styles.titleText, color: textColor}}>
        🔮 your prophecy cards 🔮
      </Text>
      {cards.length < 3 && (
        <Text
          style={{
            ...textStyleCommon,
            ...styles.descriptionText,
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
        style={styles.submitButton}
        text="read prophecy"
        textStyle={styles.submitButtonText}
        onPress={() => {
          onSubmit();
        }}
        isDisabled={cards.length < 3}
        useSaturatedColor
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
    fontSize: 18,
    fontWeight: '200',
    paddingBottom: 24,
    textAlign: 'center',
  },
  submitButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 18,
    padding: 8,
  },
});

export default ProphecyCardsView;
