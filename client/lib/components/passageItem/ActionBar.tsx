import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Tag from './Tag';
import TagType from '../../types/tag';
import ThemeType from '../../types/theme';
import {RootState} from '../../utility/redux';
import {useSelector} from 'react-redux';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Ionicon from 'react-native-vector-icons/Ionicons';

type Props = {
  tags: TagType[];
  theme: ThemeType;
  passageItemKey?: {
    passageKey: string;
    groupKey: string;
  };
  navigateToFullLyrics: () => void;
};

const ActionBar = (props: Props) => {
  console.log(`rendering ActionBar ${props.passageItemKey?.groupKey}`);

  const {tags, theme, passageItemKey, navigateToFullLyrics} = props;

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
        <Pressable style={styles.actionButton}>
          <Ionicon name="heart-outline" size={24} color={theme.detailColor} />
          <Text style={{...styles.actionText, color: theme.detailColor}}>
            like
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicon name="share-outline" size={24} color={theme.detailColor} />
          <Text style={{...styles.actionText, color: theme.detailColor}}>
            share
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <MaterialIcon
            name="expand"
            size={24}
            color={theme.detailColor}
            onPress={() => navigateToFullLyrics()}
          />
          <Text style={{...styles.actionText, color: theme.detailColor}}>
            full lyrics
          </Text>
        </Pressable>
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
