import {StyleSheet, View} from 'react-native';
import IntervalSelector from './IntervalSelector';
import React, {useState} from 'react';
import ChartBody from './ChartBody';
import {useTopSentiments} from '../../utility/redux/stats/selectors';
import {TopSentimentData, TopSentimentsInterval} from '../../types/sentiments';

type Props = {
  availableHeight: number;
};

const Chart = (props: Props) => {
  const {availableHeight} = props;
  const data = useTopSentiments();
  const intervals = Object.keys(data).sort((a, b) => {
    const order = ['last-day', 'last-week', 'all-time'];
    return order.indexOf(a) - order.indexOf(b);
  }) as TopSentimentsInterval[];
  const [activeInterval, setActiveInterval] =
    useState<TopSentimentsInterval>('last-day');

  const intervalData = intervals.map(interval => ({
    interval: interval as TopSentimentsInterval,
    data:
      (data[interval] as TopSentimentData[] | null)?.map((d, index) => {
        return {
          label: d.sentiment,
          value: Math.round(d.percentage),
          artists: d.artists.map(artist => artist.name),
          leftShiftForTooltip:
            index >= data[interval]!.length - 2 ? 5 * 24 + 12 : undefined,
        };
      }) ?? null,
  }));

  const height = Math.min(availableHeight, 500);
  const extraSpace = availableHeight - height;
  const paddingTop = Math.min(extraSpace, 20);

  return (
    <View style={{...styles.container, height, paddingTop}}>
      <IntervalSelector
        invervals={intervals}
        activeInterval={activeInterval}
        setActiveInterval={setActiveInterval}
      />
      <ChartBody
        height={height - 160}
        tabProps={intervalData.find(d => d.interval === activeInterval)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
});

export default Chart;
