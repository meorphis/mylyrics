import React, {memo, useMemo, useState} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BarChart} from 'react-native-gifted-charts';

import {
  BottomSheetBackgroundComponent,
  useBottomSheetBackdrop,
} from '../../utility/helpers/bottom_sheet';
import {textStyleCommon} from '../../utility/helpers/text';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Svg, {Path} from 'react-native-svg';
import {useTopSentiments} from '../../utility/redux/stats/selectors';
import {TopSentimentData, TopSentimentsInterval} from '../../types/sentiments';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
};

const labelForInterval = (interval: TopSentimentsInterval) => {
  switch (interval) {
    case 'last-day':
      return 'past day';
    case 'last-week':
      return 'past week';
    case 'all-time':
      return 'all time';
  }
};

const StatsBottomSheet = (props: Props) => {
  const {bottomSheetRef} = props;
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get('window').height;
  const windowWidth = Dimensions.get('window').width;
  const snapPoints = useMemo(() => [windowHeight - insets.top - 24], []);
  const [activeTabKey, setActiveTabKey] = useState('last-day');

  const data = useTopSentiments();
  const intervals = Object.keys(data).sort((a, b) => {
    const order = ['last-day', 'last-week', 'all-time'];
    return order.indexOf(a) - order.indexOf(b);
  });
  const intervalData = intervals.map(interval => ({
    interval: interval as TopSentimentsInterval,
    data:
      (data[interval] as TopSentimentData[] | null)?.map((d, index) => {
        return {
          label: d.sentiment,
          value: Math.round(d.percentage),
          artists: d.artists.map(artist => artist.name),
          leftShiftForTooltip:
            index >= data[interval].length - 2 ? 5 * 24 + 12 : undefined,
        };
      }) ?? null,
  }));

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={useBottomSheetBackdrop({opacity: 0.8})}
      enablePanDownToClose
      backgroundComponent={BottomSheetBackgroundComponent}>
      <View style={styles.container}>
        <Text style={{...textStyleCommon, ...styles.titleText}}>
          🤓 your stats 🤓
        </Text>
        <Text
          style={{
            ...textStyleCommon,
            ...styles.descriptionText,
          }}>
          top recent vibes - updated daily
        </Text>
        <View style={{flex: 1, flexDirection: 'column'}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'flex-start',
              width: '100%',
              paddingHorizontal: 4,
              paddingBottom: 0,
              zIndex: 1,
            }}>
            {intervalData.map(d => {
              const {interval} = d;
              return (
                <FlatListText
                  interval={interval}
                  isActive={interval === activeTabKey}
                  setAsActive={() => {
                    setActiveTabKey(interval);
                  }}
                />
              );
            })}
          </View>
          <Chart
            windowWidth={windowWidth}
            snapPoints={snapPoints}
            tabProps={intervalData.find(d => d.interval === activeTabKey)}
          />
        </View>
      </View>
      {/* <Chart windowWidth={windowWidth} snapPoints={snapPoints} /> */}
    </BottomSheet>
  );
};

type FlatListTextProps = {
  interval: TopSentimentsInterval;
  isActive: boolean;
  setAsActive: () => void;
};

const FlatListText = (props: FlatListTextProps) => {
  const {interval, isActive, setAsActive} = props;

  return (
    <View key={interval}>
      <TouchableOpacity onPress={setAsActive}>
        <Text
          style={{
            ...textStyleCommon,
            fontSize: 18,
            ...(isActive
              ? {textDecorationLine: 'underline', fontWeight: '500'}
              : {}),
            textAlign: 'center',
          }}>
          {labelForInterval(interval)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

type ChartProps = {
  windowWidth: number;
  snapPoints: number[];
  tabProps:
    | {
        interval: TopSentimentsInterval;
        data:
          | {
              label: string;
              value: number;
              artists: string[];
              leftShiftForTooltip: number | undefined;
            }[]
          | null;
      }
    | null
    | undefined;
};

const Chart = memo((props: ChartProps) => {
  const {windowWidth, snapPoints, tabProps} = props;

  if (tabProps == null || tabProps.data == null) {
    return null;
  }

  const desiredWidth = windowWidth - 112;
  const widthUnit = Math.floor(desiredWidth / 11.5);

  return (
    <View style={{width: windowWidth, paddingLeft: 12}}>
      <BarChart
        key={tabProps.interval}
        data={tabProps.data.map((d, i) => {
          return {
            ...d,
            leftShiftForTooltip:
              i >= tabProps.data!.length - 2 ? 5 * widthUnit + 12 : undefined,
          };
        })}
        width={desiredWidth + 48}
        height={snapPoints[0] - 24 - 280}
        barWidth={widthUnit * 1.5}
        spacing={widthUnit}
        yAxisLabelSuffix="%"
        hideRules
        rotateLabel
        barBorderRadius={4}
        labelsExtraHeight={144}
        activeOpacity={0.8}
        labelWidth={72}
        noOfSections={5}
        frontColor="#555"
        showGradient
        gradientColor="#333"
        maxValue={tabProps.data.reduce(
          (max, item) => Math.max(max, item.value),
          0,
        )}
        hideAxesAndRules
        initialSpacing={0}
        leftShiftForTooltip={-12}
        leftShiftForLastIndexTooltip={5 * widthUnit + 12}
        renderTooltip={({label, value}, index) => {
          const shouldFlip = index >= tabProps.data!.length - 2;
          const artists = tabProps.data![index]?.artists;

          return (
            <View
              style={{
                bottom:
                  tabProps.data![index].value < tabProps.data![0].value / 2
                    ? 120
                    : 0,
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}>
              <View
                style={{
                  backgroundColor: '#EEE',
                  borderRadius: 18,
                  borderBottomLeftRadius: shouldFlip ? 18 : 0,
                  borderBottomRightRadius: shouldFlip ? 0 : 18,
                  borderWidth: 0,
                  borderColor: '#00000040',
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  width: 6.5 * widthUnit,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    ...textStyleCommon,
                    fontSize: 18,
                    color: '#333',
                    textAlign: 'center',
                  }}>
                  {value}% {label}
                </Text>
                {artists.length > 0 && (
                  <Text
                    style={{
                      ...textStyleCommon,
                      fontSize: 14,
                      color: '#555',
                      textAlign: 'center',
                    }}>
                    (e.g. {artists.join(', ')})
                  </Text>
                )}
              </View>
              <View
                style={{
                  alignSelf: shouldFlip ? 'flex-end' : 'flex-start',
                  right: shouldFlip ? -2 : undefined,
                  left: shouldFlip ? undefined : -2,
                }}>
                <Svg width="24" height="12">
                  <Path
                    d={
                      shouldFlip
                        ? 'M 22 0 L 2 0 C 22 14 22 7 22 6 M 22 0 Z'
                        : 'M 2 0 L 22 0 C 2 14 2 7 2 6 M 2 0 Z'
                    }
                    fill="#EEE"
                  />
                </Svg>
              </View>
            </View>
          );
        }}
        xAxisLabelTextStyle={{
          ...textStyleCommon,
          textAlign: 'left',
          fontSize: 16,
          width: 144,
          marginTop: 36,
          marginLeft: 36,
        }}
        yAxisTextStyle={textStyleCommon}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 20,
    fontWeight: '300',
    paddingBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
});

export default memo(StatsBottomSheet, () => true);
