import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {TopSentimentsInterval} from '../../types/sentiments';
import {textStyleCommon} from '../../utility/helpers/text';

type Props = {
  invervals: TopSentimentsInterval[];
  activeInterval: TopSentimentsInterval;
  setActiveInterval: (key: TopSentimentsInterval) => void;
};

const IntervalSelector = (props: Props) => {
  const {invervals, activeInterval, setActiveInterval} = props;

  return (
    <View style={styles.container}>
      {invervals.map(interval => {
        return (
          <View key={interval}>
            <TouchableOpacity onPress={() => setActiveInterval(interval)}>
              <Text
                style={{
                  ...textStyleCommon,
                  ...styles.intervalText,
                  ...(interval === activeInterval
                    ? styles.activeIntervalText
                    : {}),
                }}>
                {labelForInterval(interval)}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  intervalText: {
    fontSize: 20,
    textAlign: 'center',
  },
  activeIntervalText: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default IntervalSelector;
