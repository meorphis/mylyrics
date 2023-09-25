import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {PassageType} from '../../types/passage';
import React from 'react';
import {textStyleCommon} from '../../utility/helpers/text';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {removeCard} from '../../utility/redux/prophecy/slice';

type Props = {
  card: PassageType | undefined;
  index: number;
  textColor: string;
  backgroundColor: string;
};

// a phophecy card that has been drawn with a button to remove it
const ProphecyCard = (props: Props) => {
  const {card, index, textColor, backgroundColor} = props;

  const dispatch = useDispatch();

  if (card === undefined) {
    return (
      <View
        style={{
          ...styles.container,
          ...styles.placeholderContainer,
          borderColor: textColor,
          backgroundColor,
        }}>
        <Text
          style={{
            ...textStyleCommon,
            ...styles.placeholderText,
            color: textColor,
          }}>
          {index + 1}
        </Text>
      </View>
    );
  }

  const {song, lyrics} = card;

  return (
    <View
      style={{
        ...styles.container,
        ...styles.activeContainer,
        borderColor: textColor,
      }}>
      <Image source={{uri: song.album.image.blob}} style={styles.albumImage} />
      <Text style={{...textStyleCommon, ...styles.lyrics, color: textColor}}>
        {lyrics}
      </Text>
      <Pressable
        style={styles.removeButton}
        onPress={() => {
          dispatch(removeCard(card));
        }}>
        <Ionicon name="close-circle-outline" size={24} color={textColor} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1.0,
    marginHorizontal: 8,
  },
  activeContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  albumImage: {
    marginTop: 2,
    width: 50,
    height: 50,
  },
  lyrics: {
    marginLeft: 12,
    marginRight: 24,
    flexShrink: 1,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  placeholderContainer: {
    borderStyle: 'dashed',
    height: 60,
    justifyContent: 'center',
  },
  placeholderText: {
    alignSelf: 'center',
    fontSize: 18,
  },
});

export default ProphecyCard;
