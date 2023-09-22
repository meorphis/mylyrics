import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import PassageItemCarousel from '../passageItem/PassageItemCarousel';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import {getPassageId} from '../../utility/passage_id';

const LikesCarousel = () => {
  console.log('rendering LikesCarousel');

  const likes = useSelector(
    (state: RootState) => state.recentLikes.filter(l => l.isLiked),
    (a, b) =>
      a.map(l => `${getPassageId(l.passage)}-${l.isLiked}`).join() ===
      b.map(l => `${getPassageId(l.passage)}-${l.isLiked}`).join(),
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
      groupKey="likes"
      data={likes.map(l => {
        return {
          passageKey: getPassageId(l.passage),
          passage: l.passage,
        };
      })}
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
