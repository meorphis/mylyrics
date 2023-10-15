import React, {memo} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {BarChart} from 'react-native-gifted-charts';
import {TopSentimentsInterval} from '../../types/sentiments';
import {textStyleCommon} from '../../utility/helpers/text';
import ChartTooltip from './ChartTooltip';

type Props = {
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
  height: number;
};

const ChartBody = memo((props: Props) => {
  const {tabProps, height} = props;
  const screenWidth = Dimensions.get('window').width;

  if (tabProps == null || tabProps.data == null) {
    return null;
  }

  const desiredWidth = screenWidth - 96;
  const spacing = Math.floor(desiredWidth / 19);
  const barWidth = 3 * spacing;

  return (
    <View style={{...styles.container, width: screenWidth}}>
      <BarChart
        key={tabProps.interval}
        data={tabProps.data.map((d, i) => {
          return {
            ...d,
            leftShiftForTooltip:
              i >= tabProps.data!.length - 2
                ? 2 * (barWidth + spacing) + 12
                : -12,
          };
        })}
        width={desiredWidth + 48}
        height={height}
        barWidth={barWidth}
        spacing={spacing}
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
        leftShiftForLastIndexTooltip={2 * (barWidth + spacing) + 12}
        renderTooltip={({label, value}, index: number) => {
          const shouldFlip = index >= tabProps.data!.length - 2;
          const artists = tabProps.data![index]?.artists;
          const fractionalBarHeightOfFirst =
            tabProps.data![index].value / tabProps.data![0].value;
          const bottom =
            120 - Math.max(fractionalBarHeightOfFirst - 1 / 2, 0) * 180;

          return (
            <ChartTooltip
              label={label}
              value={value}
              artists={artists}
              width={3 * barWidth + 2 * spacing}
              shouldFlip={shouldFlip}
              bottom={bottom}
            />
          );
        }}
        xAxisLabelTextStyle={{
          ...textStyleCommon,
          ...styles.xAxisText,
        }}
        yAxisTextStyle={textStyleCommon}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingLeft: 18,
  },
  xAxisText: {
    textAlign: 'left',
    fontSize: 16,
    width: 144,
    marginTop: 12,
    marginLeft: 24,
  },
});

export default ChartBody;
