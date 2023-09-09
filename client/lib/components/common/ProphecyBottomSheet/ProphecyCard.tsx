import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {PassageType} from '../../../types/passage';
import React from 'react';
import {textStyleCommon} from '../../../utility/text';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {removeCard} from '../../../utility/redux/prophecy';

type Props = {
  card: PassageType | undefined;
  index: number;
  textColor: string;
  backgroundColor: string;
};

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
            ...styles.placeholderText,
            ...textStyleCommon,
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
      <Text style={{...styles.lyrics, ...textStyleCommon, color: textColor}}>
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
    fontSize: 16,
  },
});

export default ProphecyCard;
