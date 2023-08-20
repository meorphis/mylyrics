import React, {useMemo} from 'react';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
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

type Props = {
  activeGroupKey: string | null;
  bottomSheetRef: React.RefObject<BottomSheet>;
  onGroupSelected?: () => void;
};

const GroupSelectorBottomSheet = (props: Props) => {
  const {activeGroupKey, bottomSheetRef, onGroupSelected} = props;
  const {passageKey} = useSelector((state: RootState) => state.activePassage)!;
  const allSentiments = useSelector(
    (state: RootState) => state.recommendations.map(({groupKey: gk}) => gk),
    _.isEqual,
  );
  const groupsToShow = Object.keys(groups).filter(group =>
    groups[group as GroupType].some(s => allSentiments.includes(s)),
  );
  const theme = useTheme();

  const backgroundColor = theme.backgroundColor;
  const textColor = getLyricsColor({theme});
  const groupBackgroundColor = getContrastingBackgroundColor(backgroundColor);
  const selectedGroup = activeGroupKey
    ? (Object.keys(groups).find(group =>
        (groups[group as GroupType] as SentimentEnumType[]).includes(
          activeGroupKey as SentimentEnumType,
        ),
      ) as GroupType)
    : null;

  const snapPoints = useMemo(() => ['65%'], []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: addColorOpacity(theme.backgroundColor, 0.95),
      }}>
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <Text style={{...styles.titleText, color: textColor}}>
          ✨ your recent vibes ✨
        </Text>

        {putAtFrontOfArray(groupsToShow, selectedGroup).map(group => (
          <View
            style={{...styles.group, backgroundColor: groupBackgroundColor}}
            key={group}>
            <View style={styles.groupLabel}>
              <Text style={{...styles.groupLabelText, color: textColor}}>
                {group}
              </Text>
              <Text style={styles.groupLabelEmoji}>
                {groupEmojis[group as GroupType]}
              </Text>
            </View>
            <View style={styles.tagsContainer}>
              {(
                putAtFrontOfArray(
                  groups[group as GroupType].filter(s =>
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
                      if (onGroupSelected) {
                        onGroupSelected();
                      }
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
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 2},
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
  },
  groupLabel: {
    flexDirection: 'row',
    paddingLeft: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  groupLabelText: {
    fontSize: 18,
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

type GroupType =
  | 'heart'
  | 'body'
  | 'skin'
  | 'eyes'
  | 'mind'
  | 'soul'
  | 'gut'
  | 'spine';

const groups: {[key in GroupType]: SentimentEnumType[]} = {
  body: [
    'celebratory',
    'energetic',
    'excited',
    'liberating',
    'reckless',
    'violent',
  ],
  eyes: [
    'alienated',
    'dreamy',
    'enigmatic',
    'hopeful',
    'lonely',
    'nostalgic',
    'optimistic',
  ],
  gut: [
    'betrayed',
    'bittersweet',
    'desperate',
    'frustrated',
    'melancholic',
    'vulnerable',
  ],
  heart: [
    'affectionate',
    'appreciative',
    'heartbroken',
    'intimate',
    'loyal',
    'romantic',
    'passionate',
  ],
  mind: [
    'chaotic',
    'conflicted',
    'determined',
    'disillusioned',
    'introspective',
    'obsessive',
    'philosophical',
    'regretful',
  ],
  skin: [
    'flirtatious',
    'lustful',
    'playful',
    'provocative',
    'seductive',
    'sensual',
  ],
  soul: [
    'carefree',
    'euphoric',
    'joyful',
    'peaceful',
    'rebellious',
    'spiritual',
    'surreal',
  ],
  spine: ['angry', 'empowered', 'fearful', 'resilient', 'triumphant'],
};

const groupEmojis: {[key in GroupType]: string} = {
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
