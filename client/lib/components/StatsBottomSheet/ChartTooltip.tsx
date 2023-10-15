import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {textStyleCommon} from '../../utility/helpers/text';

type Props = {
  value: number;
  label: string;
  artists: string[];
  width: number;
  bottom: number;
  shouldFlip: boolean;
};

const ChartTooltip = (props: Props) => {
  const {value, label, artists, width, bottom, shouldFlip} = props;

  return (
    <View
      style={{
        bottom,
        ...styles.container,
      }}>
      <View
        style={{
          ...styles.containerMinusArrow,
          ...(shouldFlip
            ? styles.containerMinusArrowFlipped
            : styles.containerMinusArrowNonFlipped),
          width,
        }}>
        <Text
          style={{
            ...textStyleCommon,
            ...styles.labelText,
          }}>
          {value}% {label}
        </Text>
        {artists.length > 0 && (
          <Text
            style={{
              ...textStyleCommon,
              ...styles.artistsText,
            }}>
            (e.g. {artists.join(', ')})
          </Text>
        )}
      </View>
      <View style={shouldFlip ? styles.flippedArrow : styles.arrow}>
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
};

const styles = StyleSheet.create({
  container: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  containerMinusArrow: {
    backgroundColor: '#EEE',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerMinusArrowNonFlipped: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 18,
  },
  containerMinusArrowFlipped: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 0,
  },
  arrow: {
    alignSelf: 'flex-start',
    left: -2,
  },
  flippedArrow: {
    alignSelf: 'flex-end',
    right: -2,
  },
  labelText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  artistsText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
});

export default ChartTooltip;
