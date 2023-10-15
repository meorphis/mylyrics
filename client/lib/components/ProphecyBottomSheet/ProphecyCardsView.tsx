import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {PassageType} from '../../types/passage';
import ProphecyCard from './ProphecyCard';
import {textStyleCommon} from '../../utility/helpers/text';
import ThemeButton from '../common/ThemeButton';
import {ScrollView} from 'react-native-gesture-handler';

type Props = {
  cards: PassageType[];
  onSubmit: () => void;
};

// a view of the prophecy cards that have been drawn along with a button to submit
const ProphecyCardsView = (props: Props) => {
  const {cards, onSubmit} = props;

  return (
    <ScrollView style={styles.container}>
      <Text style={{...textStyleCommon, ...styles.titleText}}>
        🔮 your cards 🔮
      </Text>
      {cards.length < 3 && (
        <Text
          style={{
            ...textStyleCommon,
            ...styles.descriptionText,
          }}>
          draw three lyric cards to have your prophecy read
        </Text>
      )}

      {[0, 1, 2].map(index => {
        const card = cards[index];
        return <ProphecyCard key={index} card={card} index={index} />;
      })}
      {cards.length === 3 && (
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
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 20,
    fontWeight: '300',
    paddingBottom: 24,
    textAlign: 'center',
    color: '#555',
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
