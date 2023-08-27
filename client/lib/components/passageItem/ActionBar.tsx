import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Tag from './Tag';
import TagType from '../../types/tag';
import ThemeType from '../../types/theme';
import {RootState} from '../../utility/redux';
import {useSelector} from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';
import {PassageType} from '../../types/passage';
import {useLikeRequest} from '../../utility/db/likes';
import Share from 'react-native-share';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  passage: PassageType;
  tags: TagType[];
  theme: ThemeType;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
  navigateToFullLyrics: () => void;
  captureViewShot: (callback: (uri: string) => void) => void;
};

const ActionBar = (props: Props) => {
  console.log(`rendering ActionBar ${props.passageItemKey?.groupKey}`);

  const {passage, tags, theme, passageItemKey, navigateToFullLyrics} = props;

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
          icon={likeRequest.data ? 'heart' : 'heart-outline'}
          IconClass={Ionicon}
          text={likeRequest.data ? 'liked' : 'like'}
          theme={theme}
        />
        <ActionBarButton
          onPress={() => {
            props.captureViewShot(uri => {
              Share.open({
                url: uri,
                type: 'image/jpeg',
                title: 'Share',
                failOnCancel: false,
              })
                .then(res => {
                  console.log(res);
                })
                .catch(err => {
                  err && console.log(err);
                });
            });
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
        />
      </View>
    </View>
  );
};

const ActionBarButton = (props: {
  onPress: () => void;
  icon: string;
  IconClass: React.ComponentType<any>;
  text: string;
  theme: ThemeType;
}) => {
  const {onPress, icon, IconClass, text, theme} = props;

  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => {
    return {
      ...styles.actionButton,
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  });

  return (
    <AnimatedPressable
      style={style}
      onPress={() => {
        onPress();
        scale.value = withSpring(
          1.1,
          {duration: 50},
          () => (scale.value = withTiming(1, {duration: 200})),
        );
      }}>
      <IconClass name={icon} size={24} color={theme.detailColor} />
      <Text style={{...styles.actionText, color: theme.detailColor}}>
        {text}
      </Text>
    </AnimatedPressable>
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
    justifyContent: 'space-evenly',
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
