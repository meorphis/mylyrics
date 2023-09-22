// renders a single tag for a passage

import TagType from '../../types/tag';
import React from 'react';
import ThemeButton from '../common/ThemeButton';
import {StyleSheet} from 'react-native';
import {useSetActiveGroup} from '../../utility/active_passage';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../types/navigation';
import {sentimentAdjectiveToNoun} from '../../utility/sentiments';

type Props = {
  tag: TagType;
  isActiveGroup: boolean;
  includeEmoji?: boolean;
  onPress?: () => void;
};

const Tag = (props: Props) => {
  console.log(`rendering Tag ${props.tag.sentiment}`);

  const {tag, isActiveGroup, onPress} = props;

  const setActiveGroup = useSetActiveGroup({groupKey: tag.sentiment});
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <ThemeButton
      text={sentimentAdjectiveToNoun(tag.sentiment)!}
      textStyle={styles.buttonText}
      useSaturatedColor={isActiveGroup}
      onPress={() => {
        const {routes} = navigation.getState();
        const onMain = routes[routes.length - 1].name === 'Main';
        const timeout = onMain ? 0 : 250;

        console.log(`onMain: ${onMain}, timeout: ${timeout}`);

        setTimeout(() => {
          navigation.navigate('Main');
          setActiveGroup();
        }, timeout);

        if (onPress) {
          onPress();
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Tag;
