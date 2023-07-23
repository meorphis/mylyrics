import React from 'react';
import {StyleSheet, View} from 'react-native';
import Tag from './Tag';
import TagType from '../types/tag';
import ThemeType from '../types/theme';

type Props = {
  tags: TagType[];
  theme: ThemeType | undefined;
  passageKey: string;
};

// renders a row of tags for a passage
const TagSection = (props: Props) => {
  const {tags, theme, passageKey} = props;

  return (
    <View style={styles.sentimentsRow}>
      {tags.map((tag, index) => (
        <View key={index}>
          <Tag tag={tag} theme={theme} passageKey={passageKey} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sentimentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});

export default TagSection;
