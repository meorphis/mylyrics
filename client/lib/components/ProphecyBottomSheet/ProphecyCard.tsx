import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {PassageType} from '../../types/passage';
import React from 'react';
import {textStyleCommon} from '../../utility/helpers/text';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {removeCard} from '../../utility/redux/prophecy/slice';
import {isColorLight} from '../../utility/helpers/color';
import {trigger as triggerHapticFeedback} from 'react-native-haptic-feedback';
import { useAlbumArt } from '../../utility/redux/album_art/selectors';

type Props = {
  card: PassageType | undefined;
  index: number;
};

// a phophecy card that has been drawn with a button to remove it
const ProphecyCard = (props: Props) => {
  const {card, index} = props;

  const dispatch = useDispatch();
  const imageUrl = card?.song.album.image.url;
  const imageBlob = useAlbumArt(card?.song.album.image.url);

  if (card === undefined) {
    return (
      <View
        style={{
          ...styles.container,
          ...styles.placeholderContainer,
        }}>
        <Text
          style={{
            ...textStyleCommon,
            ...styles.placeholderText,
          }}>
          {index + 1}
        </Text>
      </View>
    );
  }

  const {song, lyrics, theme} = card;
  const {backgroundColor} = theme;
  const textColor = isColorLight(backgroundColor) ? 'black' : 'white';
  const borderColor = isColorLight(backgroundColor) ? '#00000040' : '#ffffff40';

  return (
    <View
      style={{
        ...styles.container,
        ...styles.activeContainer,
        borderColor,
        backgroundColor: theme.backgroundColor,
      }}>
      {imageBlob ? <Image source={{uri: imageBlob}} style={styles.albumImage} /> 
        : <View style={{...styles.albumImage, backgroundColor: theme.backgroundColor}}/>
      }
      <Text style={{...textStyleCommon, ...styles.lyrics, color: textColor}}>
        {lyrics}
      </Text>
      <Pressable
        style={styles.removeButton}
        onPress={() => {
          triggerHapticFeedback('impactLight');
          dispatch(removeCard(card));
        }}>
        <Ionicon name="close-circle-outline" size={24} color={textColor} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 16,
    marginHorizontal: 16,
    elevation: 2,
  },
  activeContainer: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 3,
  },
  albumImage: {
    width: 60,
    height: 60,
  },
  lyrics: {
    marginLeft: 20,
    flex: 1,
    fontSize: 14,
  },
  removeButton: {
    marginLeft: 12,
  },
  placeholderContainer: {
    borderStyle: 'dashed',
    height: 80,
    justifyContent: 'center',
    backgroundColor: '#E9E9E9',
    borderWidth: 1.5,
  },
  placeholderText: {
    alignSelf: 'center',
    fontSize: 24,
  },
});

export default ProphecyCard;
