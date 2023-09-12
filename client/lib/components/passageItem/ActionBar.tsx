import React from 'react';
import {StyleSheet, View} from 'react-native';
import Tag from './Tag';
import TagType from '../../types/tag';
import ThemeType from '../../types/theme';
import {RootState} from '../../utility/redux';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {PassageType} from '../../types/passage';
import {useLikeRequest} from '../../utility/db/likes';
import ActionBarButton from './ActionBarButton';
import {getPassageId} from '../../utility/passage_id';
import {addCard, removeCard} from '../../utility/redux/prophecy';

type Props = {
  passage: PassageType;
  tags: TagType[];
  theme: ThemeType;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
  navigateToFullLyrics: () => void;
  onSharePress: () => void;
};

const ActionBar = (props: Props) => {
  console.log(`rendering ActionBar ${props.passageItemKey?.groupKey}`);

  const {
    passage,
    tags,
    theme,
    passageItemKey,
    navigateToFullLyrics,
    onSharePress,
  } = props;

  const isActivePassage = useSelector(
    (state: RootState) =>
      state.activePassage.passageKey === passageItemKey?.passageKey &&
      state.activePassage.groupKey === passageItemKey?.groupKey,
    (a, b) => a === b,
  );

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

  const orderedTags = useSelector(
    (state: RootState) => selectOrderedTags(state, tags),
    () => true,
  );

  return (
    <View style={styles.actionBar}>
      {passageItemKey && (
        <View style={styles.sentimentsRow}>
          {orderedTags.map((tag, index) => {
            const isActiveGroup = tag.sentiment === passageItemKey.groupKey;
            return (
              <View key={index}>
                <Tag
                  tag={tag}
                  theme={theme}
                  isActiveGroup={isActiveGroup}
                  passageKey={passageItemKey.passageKey}
                />
              </View>
            );
          })}
        </View>
      )}
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
          theme={theme}
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
          theme={theme}
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
          theme={theme}
        />
        <ActionBarButton
          onPress={() => {
            navigateToFullLyrics();
          }}
          icon="expand"
          IconClass={MaterialIcon}
          text="full lyrics"
          theme={theme}
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

// we order tags the same way they are ordered in the recommendations array (or alphabetically if
// neither is present)
const selectOrderedTags = (state: RootState, tags: TagType[]) =>
  tags.slice().sort((a: TagType, b: TagType) => {
    const aIndex = state.recommendations.findIndex(
      ({groupKey}) => groupKey === a.sentiment,
    );
    const bIndex = state.recommendations.findIndex(
      ({groupKey}) => groupKey === b.sentiment,
    );

    if (aIndex === -1 && bIndex === -1) {
      return a.sentiment < b.sentiment ? -1 : 1;
    }

    if (aIndex === -1) {
      return 1;
    }

    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'column',
  },
  sentimentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
    justifyContent: 'center',
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

export default ActionBar;
