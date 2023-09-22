import React, {memo, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {RootState} from '../../utility/redux';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {PassageType} from '../../types/passage';
import {useLikeRequest} from '../../utility/db/likes';
import ActionBarButton from './ActionBarButton';
import {getPassageId} from '../../utility/passage_id';
import {addCard, removeCard} from '../../utility/redux/prophecy';
import {useIsActivePassage} from '../../utility/active_passage';

type Props = {
  passage: PassageType;
  parentYPosition: number;
  navigateToFullLyrics: (parentYPosition: number) => void;
  onSharePress: () => void;
};

const ActionBar = (props: Props) => {
  console.log(`rendering ActionBar ${props.passage.song.name}`);

  const {passage, navigateToFullLyrics, parentYPosition, onSharePress} = props;

  // memoized passage key
  const passageKey = useMemo(() => getPassageId(passage), [passage]);

  const isActivePassage = useIsActivePassage({
    passageKey,
  });

  const isDrawn = useSelector(
    (state: RootState) =>
      state.prophecy.cards.findIndex(
        card => getPassageId(card) === getPassageId(passage),
      ) !== -1,
    (a, b) => a === b,
  );

  const canDraw = useSelector(
    (state: RootState) => state.prophecy.cards.length < 3,
  );

  const canUndraw = useSelector(
    (state: RootState) => state.prophecy.prophecy == null,
  );

  const dispatch = useDispatch();

  const {request: likeRequest, toggleLike} = useLikeRequest(passage);

  return (
    <View style={styles.actionBar}>
      <View style={styles.buttonContainer}>
        <ActionBarButton
          onPress={() => {
            if (likeRequest.status === 'loading') {
              return;
            }

            toggleLike();
          }}
          icon="heart-outline"
          IconClass={Ionicon}
          text="like"
          theme={passage.theme}
          walkthroughStep={
            isActivePassage
              ? {
                  step: 'like',
                  text: 'like a lyric card to save it to your favorites',
                }
              : undefined
          }
          activeState={{
            initialIsActive: likeRequest.data,
            activeText: 'liked',
            activeIcon: 'heart',
          }}
        />
        <ActionBarButton
          onPress={() => {
            if (isDrawn) {
              dispatch(removeCard(passage));
              return;
            }

            if (!canDraw) {
              return;
            }

            dispatch(addCard(passage));
          }}
          icon="add-circle-outline"
          IconClass={Ionicon}
          text="draw"
          theme={passage.theme}
          isDisabled={(!isDrawn && !canDraw) || (isDrawn && !canUndraw)}
          walkthroughStep={
            isActivePassage
              ? {
                  step: 'draw',
                  text: 'draw a lyric card to include it in your prophecy',
                }
              : undefined
          }
          activeState={{
            initialIsActive: isDrawn,
            activeText: 'drawn',
            activeIcon: 'add-circle',
          }}
        />
        <ActionBarButton
          onPress={() => {
            onSharePress();
          }}
          icon="share-outline"
          IconClass={Ionicon}
          text="share"
          theme={passage.theme}
        />
        <ActionBarButton
          onPress={() => {
            navigateToFullLyrics(parentYPosition);
          }}
          icon="expand"
          IconClass={MaterialIcon}
          text="full lyrics"
          theme={passage.theme}
          walkthroughStep={
            isActivePassage
              ? {
                  step: 'full_lyrics',
                  text: 'view the full lyrics for this song and select a different passage to like, share or draw',
                }
              : undefined
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'column',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
  },
});

export default memo(
  ActionBar,
  (prevProps, nextProps) =>
    prevProps.parentYPosition === nextProps.parentYPosition &&
    prevProps.passage.lyrics === nextProps.passage.lyrics,
);
