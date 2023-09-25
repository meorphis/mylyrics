import React, {memo, useMemo} from 'react';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {StyleSheet, Text, View} from 'react-native';
import SentimentEnumType from '../../types/sentiments';
import {textStyleCommon} from '../../utility/helpers/text';
import {useBottomSheetBackdrop} from '../../utility/helpers/bottom_sheet';
import {
  useActiveBundleKey,
  useGroupedBundleKeys,
} from '../../utility/redux/bundles/selectors';
import {allSentiments} from '../../utility/helpers/sentiments';
import GroupSelectorButton from './GroupSelectorButton';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
};

// bottom sheet to allow the user to change the active bundle
const GroupSelectorBottomSheet = (props: Props) => {
  const {bottomSheetRef} = props;
  const activeBundleKey = useActiveBundleKey();
  const groupedBundleKeys = useGroupedBundleKeys();
  const groupsToShow = Object.keys(groupedBundleKeys);

  const textColor = 'black';
  const groupBackgroundColor = '#00000040';
  const selectedGroup = activeBundleKey
    ? groupsToShow.find(group =>
        (groupedBundleKeys[group] as SentimentEnumType[]).includes(
          activeBundleKey as SentimentEnumType,
        ),
      )
    : null;

  const snapPoints = useMemo(() => ['85%'], []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={useBottomSheetBackdrop({opacity: 0.8})}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheet}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <Text
          style={{...textStyleCommon, ...styles.titleText, color: textColor}}>
          ✨ your daily vibes ✨
        </Text>

        {putAtFrontOfArray(groupsToShow, selectedGroup).map(group => (
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
                  groupedBundleKeys[group].filter(s =>
                    allSentiments.includes(s as SentimentEnumType),
                  ) as SentimentEnumType[],
                  activeBundleKey,
                ) as SentimentEnumType[]
              ).map(sentiment => (
                <View style={styles.tagContainer} key={sentiment}>
                  <GroupSelectorButton
                    bundleKey={sentiment}
                    onPress={() => {
                      bottomSheetRef.current?.close();
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

export default memo(GroupSelectorBottomSheet, () => true);
