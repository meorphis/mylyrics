import React, {memo, useMemo} from 'react';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import {textStyleCommon} from '../../utility/helpers/text';
import {
  BottomSheetBackgroundComponent,
  useBottomSheetBackdrop,
} from '../../utility/helpers/bottom_sheet';
import {useGroupedBundleInfos} from '../../utility/redux/bundles/selectors';
import GroupSelectorButton from './GroupSelectorButton';
import {BundleInfo} from '../../types/bundle';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
};

// bottom sheet to allow the user to change the active bundle
const GroupSelectorBottomSheet = (props: Props) => {
  const {bottomSheetRef} = props;
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get('window').height;
  const groupedBundleInfos = useGroupedBundleInfos();
  const groupsToShow = Object.keys(groupedBundleInfos);

  const snapPoints = useMemo(() => [windowHeight - insets.top - 24], []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={useBottomSheetBackdrop({opacity: 0.8})}
      enablePanDownToClose
      // backgroundStyle={styles.bottomSheet}
      backgroundComponent={BottomSheetBackgroundComponent}>
      <BottomSheetScrollView
        contentContainerStyle={{
          ...styles.container,
          paddingBottom: insets.bottom + 12,
        }}>
        {putAtFrontOfArray(groupsToShow, i => i === 'essentials').map(group => (
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
                {groupDisplayName(group)}
              </Text>
              {/* <Text style={styles.groupLabelEmojiText}>
                {groupEmojis[group]}
              </Text> */}
            </View>
            <View style={styles.tagsContainer}>
              {groupedBundleInfos[group].sort(compareBundles).map(info => (
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
        ))}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const compareBundles = (a: BundleInfo, b: BundleInfo) => {
  if (a.group !== 'essentials' || b.group !== 'essentials') {
    return 0;
  }

  const order = ['top', 'likes'];

  const aIndex = order.indexOf(a.type);
  const bIndex = order.indexOf(b.type);

  return aIndex - bIndex;
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

const groupDisplayName = (group: string) => {
  if (group === 'featured') {
    return 'featured artist';
  }

  return group;
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bottomSheet: {
    backgroundColor: '#EEE',
  },
  // titleText: {
  //   fontSize: 28,
  //   fontWeight: 'bold',
  //   paddingBottom: 16,
  //   textAlign: 'center',
  //   color: '#333',
  // },
  group: {
    flexDirection: 'column',
    paddingBottom: 20,
    borderRadius: 30,
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  groupLabelEmojiText: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.4,
    shadowRadius: 2,
    fontSize: 28,
  },
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagContainer: {
    marginHorizontal: 0,
    padding: 8,
    width: '50%',
    height: 100,
  },
});

// const groupEmojis: {[key: string]: string} = {
//   body: '🤸‍♂️',
//   eyes: '👁️',
//   gut: '🤢',
//   heart: '💖',
//   mind: '🧠',
//   skin: '🫦',
//   soul: '🕊️',
//   spine: '🦾',
//   essentials: '🤠',
//   featured: '🤩',
// };

export default memo(GroupSelectorBottomSheet, () => true);
