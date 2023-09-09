import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import PassageItemCarousel from '../passageItem/PassageItemCarousel';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import {getPassageId} from '../../utility/passage_id';
import ThemedPassageItem from '../passageItem/ThemedPassageItem';
import {RecentLike} from '../../types/likes';

const LikesCarousel = () => {
  console.log('rendering LikesCarousel');

  const likes = useSelector(
    (state: RootState) => state.recentLikes.filter(l => l.isLiked),
    (a, b) =>
      a.map(l => getPassageId(l.passage)).join() ===
      b.map(l => getPassageId(l.passage)).join(),
  );

  const firstPassage = likes[0]?.passage;
  const [activePassageId, setActivePassageId] = useState<string | undefined>(
    firstPassage && getPassageId(firstPassage),
  );

  if (likes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noLikesText}>you haven't liked anything yet</Text>
      </View>
    );
  }

  return (
    <PassageItemCarousel
      data={likes}
      renderItem={({item}: {item: RecentLike; index: number}) => {
        return (
          <ThemedPassageItem
            passage={item.passage}
            passageIsActive={getPassageId(item.passage) === activePassageId}
          />
        );
      }}
      onBeforeSnapToItem={index => {
        setActivePassageId(getPassageId(likes[index].passage));
      }}
      keyExtractor={(item: RecentLike, index: number) =>
        `${getPassageId(item.passage)}:${index}`
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    marginLeft: 4,
    color: 'darkred',
  },
  noLikesText: {
    marginLeft: 4,
    color: 'black',
  },
});

export default LikesCarousel;
