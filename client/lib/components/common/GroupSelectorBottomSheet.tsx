import React, {useCallback, useMemo} from 'react';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {StyleSheet, Text, View} from 'react-native';
import Tag from '../passageItem/Tag';
import SentimentEnumType from '../../types/sentiments';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import _ from 'lodash';
import {textStyleCommon} from '../../utility/text';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../types/navigation';

type Props = {
  activeGroupKey: string | null;
  bottomSheetRef: React.RefObject<BottomSheet>;
};

const GroupSelectorBottomSheet = (props: Props) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {activeGroupKey, bottomSheetRef} = props;
  const allSentiments = useSelector(
    (state: RootState) => state.recommendations.map(({groupKey: gk}) => gk),
    _.isEqual,
  );
  const groupsToShow = useSelector((state: RootState) => state.sentimentGroups);
  const groupsAsMap = groupsToShow.reduce(
    (acc, {group, sentiments}) => ({
      ...acc,
      [group]: sentiments,
    }),
    {} as {[group: string]: string[]},
  );

  const textColor = 'black';
  const groupBackgroundColor = '#00000040';
  const selectedGroup = activeGroupKey
    ? groupsToShow
        .map(({group}) => group)
        .find(group =>
          (groupsAsMap[group] as SentimentEnumType[]).includes(
            activeGroupKey as SentimentEnumType,
          ),
        )
    : null;

  const snapPoints = useMemo(() => ['85%'], []);

  const renderBackdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheet}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <Text
          style={{...textStyleCommon, ...styles.titleText, color: textColor}}>
          ✨ your daily vibes ✨
        </Text>

        {putAtFrontOfArray(
          groupsToShow.map(({group}) => group),
          selectedGroup,
        ).map(group => (
          <View
            style={{
              ...styles.group,
              backgroundColor: groupBackgroundColor,
              borderColor: textColor,
            }}
            key={group}>
            <View style={styles.groupLabel}>
              <Text
                style={{
                  ...textStyleCommon,
                  ...styles.groupLabelText,
                  color: textColor,
                }}>
                {group}
              </Text>
              <Text style={styles.groupLabelEmoji}>{groupEmojis[group]}</Text>
            </View>
            <View style={styles.tagsContainer}>
              {(
                putAtFrontOfArray(
                  groupsAsMap[group].filter(s =>
                    allSentiments.includes(s),
                  ) as SentimentEnumType[],
                  activeGroupKey,
                ) as SentimentEnumType[]
              ).map(sentiment => (
                <View style={styles.tagContainer} key={sentiment}>
                  <Tag
                    tag={{
                      type: 'sentiment',
                      sentiment: sentiment,
                    }}
                    isActiveGroup={activeGroupKey === sentiment}
                    onPress={() => {
                      bottomSheetRef.current?.close();

                      setTimeout(() => {
                        navigation.navigate('Main');
                      }, 100);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

// re-arranges the list, putting the item at the front of the array but retaining
// the same sorting order when considering the items as a loop
const putAtFrontOfArray = (array: any[], item: any) => {
  const index = array.indexOf(item);

  if (index === -1) {
    return array;
  }

  return [...array.slice(index), ...array.slice(0, index)];
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bottomSheet: {
    backgroundColor: 'lightgrey',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 16,
    textAlign: 'center',
  },
  group: {
    flexDirection: 'column',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 0.2,
  },
  groupLabel: {
    flexDirection: 'row',
    paddingLeft: 10,
    alignItems: 'center',
  },
  groupLabelText: {
    fontSize: 20,
    paddingRight: 8,
    fontWeight: 'bold',
  },
  groupLabelEmoji: {
    fontSize: 24,
  },
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagContainer: {
    marginHorizontal: 4,
    paddingTop: 8,
  },
});

const groupEmojis: {[key: string]: string} = {
  body: '🤸‍♂️',
  eyes: '👁️',
  gut: '🤢',
  heart: '💖',
  mind: '🧠',
  skin: '👄',
  soul: '🕊️',
  spine: '🦾',
};

export default GroupSelectorBottomSheet;
