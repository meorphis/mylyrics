import React, {memo, useMemo} from 'react';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {StyleSheet, Text, View} from 'react-native';
import {textStyleCommon} from '../../utility/helpers/text';
import {useBottomSheetBackdrop} from '../../utility/helpers/bottom_sheet';
import {
  useActiveBundleKey,
  useGroupedBundleInfos,
} from '../../utility/redux/bundles/selectors';
import GroupSelectorButton from './GroupSelectorButton';
import {BundleInfo} from '../../types/bundle';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
};

// bottom sheet to allow the user to change the active bundle
const GroupSelectorBottomSheet = (props: Props) => {
  const {bottomSheetRef} = props;
  const activeBundleKey = useActiveBundleKey();
  const groupedBundleInfos = useGroupedBundleInfos();
  const groupsToShow = Object.keys(groupedBundleInfos);
  const selectedGroup = activeBundleKey
    ? groupsToShow.find(group =>
        groupedBundleInfos[group]
          .map(i => i.key)
          .includes(activeBundleKey as string),
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
        <Text style={{...textStyleCommon, ...styles.titleText}}>
          🎶 your daily lines 🎶
        </Text>

        {putAtFrontOfArray(groupsToShow, i => i === selectedGroup).map(
          group => (
            <View
              style={{
                ...styles.group,
              }}
              key={group}>
              <View style={styles.groupLabel}>
                <Text
                  style={{
                    ...textStyleCommon,
                    ...styles.groupLabelText,
                  }}>
                  {group}
                </Text>
                <View style={styles.groupLabelEmoji}>
                  <Text style={styles.groupLabelEmojiText}>
                    {groupEmojis[group]}
                  </Text>
                </View>
              </View>
              <View style={styles.tagsContainer}>
                {(
                  putAtFrontOfArray(
                    groupedBundleInfos[group],
                    i => i.key === activeBundleKey,
                  ) as BundleInfo[]
                ).map(info => (
                  <View style={styles.tagContainer} key={info.key}>
                    <GroupSelectorButton
                      bundleInfo={info}
                      onPress={() => {
                        bottomSheetRef.current?.close();
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          ),
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

// re-arranges the list, putting the item at the front of the array but retaining
// the same sorting order when considering the items as a loop
const putAtFrontOfArray = (array: any[], isItem: (i: any) => boolean) => {
  const index = array.findIndex(isItem);

  if (index === -1) {
    return array;
  }

  return [...array.slice(index), ...array.slice(0, index)];
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bottomSheet: {
    backgroundColor: '#CCC',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  group: {
    flexDirection: 'column',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginBottom: 20,
    backgroundColor: '#00000040',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1,
    borderWidth: 3,
    borderColor: '#00000040',
  },
  groupLabel: {
    flexDirection: 'row',
    paddingLeft: 10,
    alignItems: 'center',
  },
  groupLabelText: {
    fontSize: 24,
    paddingRight: 8,
    color: '#333',
    fontWeight: '600',
  },
  groupLabelEmoji: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  groupLabelEmojiText: {
    fontSize: 28,
  },
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagContainer: {
    marginHorizontal: 4,
    paddingTop: 12,
  },
});

const groupEmojis: {[key: string]: string} = {
  body: '🤸‍♂️',
  eyes: '👁️',
  gut: '🤢',
  heart: '💖',
  mind: '🧠',
  skin: '🫦',
  soul: '🕊️',
  spine: '🦾',
  essentials: '🤠',
};

export default memo(GroupSelectorBottomSheet, () => true);
