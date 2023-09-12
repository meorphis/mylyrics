import React, {useCallback, useMemo} from 'react';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../../utility/theme';
import {
  addColorOpacity,
  ensureColorContrast,
  isColorLight,
} from '../../utility/color';
import Tag from '../passageItem/Tag';
import SentimentEnumType from '../../types/sentiments';
import {useSelector} from 'react-redux';
import {RootState} from '../../utility/redux';
import _ from 'lodash';
import tinycolor from 'tinycolor2';
import {getLyricsColor} from '../../utility/lyrics';
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
  const {passageKey} = useSelector((state: RootState) => state.activePassage)!;
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
  console.log(groupsAsMap);
  const theme = useTheme();

  const backgroundColor = theme.backgroundColor;
  const textColor = getLyricsColor({theme});
  const groupBackgroundColor = getContrastingBackgroundColor(backgroundColor);
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
      backgroundStyle={{
        backgroundColor: addColorOpacity(theme.backgroundColor, 0.95),
      }}>
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
                    theme={theme}
                    isActiveGroup={activeGroupKey === sentiment}
                    passageKey={
                      activeGroupKey === sentiment ? passageKey : null
                    }
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

const getContrastingBackgroundColor = (backgroundColor: string) => {
  const {lightenable, darkenable} = ensureColorContrast({
    lightenable: backgroundColor,
    darkenable: backgroundColor,
    preference: isColorLight(backgroundColor) ? 'darken' : 'lighten',
    minDistance: 6,
  });

  const color = isColorLight(backgroundColor) ? darkenable : lightenable;
  return tinycolor(color).setAlpha(0.5).toRgbString();
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
    paddingHorizontal: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 16,
    textAlign: 'center',
  },
  group: {
    flexDirection: 'column',
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 0.2,
  },
  groupLabel: {
    flexDirection: 'row',
    paddingLeft: 12,
    paddingBottom: 4,
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
    paddingVertical: 4,
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
