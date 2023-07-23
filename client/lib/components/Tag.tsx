// renders a single tag for a passage

import {StyleSheet, TouchableOpacity, View} from 'react-native';
import StyledText from './StyledText';
import TagType from '../types/tag';
import React from 'react';
import {sentimentToEmojiMap} from '../utility/sentiments';
import ThemeType from '../types/theme';
import {colorToComplementaryGrey, isColorLight} from '../utility/color';
import {useActiveGroup} from '../utility/active_group';

type Props = {
  tag: TagType;
  theme: ThemeType | undefined;
  passageKey: string;
};

const Tag = (props: Props) => {
  const {tag, theme, passageKey} = props;

  const {isActiveGroup, setActiveGroup} = useActiveGroup(tag.sentiment);

  const backgroundColor =
    (isActiveGroup ? theme?.detailColor : undefined) ||
    (theme?.detailColor != null
      ? colorToComplementaryGrey(theme!.detailColor)
      : '#8B8B8B'); // default to light grey
  const isBackgroundColorLight = isColorLight(backgroundColor);
  const textColor = isBackgroundColorLight ? '#000000' : '#FFFFFF';
  const borderColor = isActiveGroup
    ? isBackgroundColorLight
      ? '#444444'
      : '#CCCCCC'
    : undefined;
  const emojiBackgroundColor = isBackgroundColorLight
    ? 'rgba(0, 0, 0, 0.1)'
    : 'rgba(255, 255, 255, 0.1)';

  return (
    <TouchableOpacity
      style={{
        ...(isActiveGroup ? styles.activeSentimentTag : styles.sentimentTag),
        backgroundColor,
        borderColor,
      }}
      onPress={() =>
        setActiveGroup({
          passageKey,
        })
      }>
      <View
        style={{
          ...styles.emojiContainer,
          backgroundColor: emojiBackgroundColor,
        }}>
        <StyledText style={styles.emojiText}>
          {sentimentToEmojiMap[tag.sentiment]}
        </StyledText>
      </View>
      <StyledText style={{color: textColor}}>{tag.sentiment}</StyledText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sentimentTag: {
    borderRadius: 10,
    padding: 10,
    alignSelf: 'flex-start',
    margin: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent black border
  },
  activeSentimentTag: {
    borderRadius: 10,
    padding: 10,
    alignSelf: 'flex-start',
    margin: 5,
    borderWidth: 2,
    shadowColor: '#000', // Adding a subtle drop shadow
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  emojiContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
    borderRadius: 80,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  emojiText: {
    fontSize: 14,
  },
});
export default Tag;
