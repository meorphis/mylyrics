import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {textStyleCommon} from '../../../utility/text';

type Props = {
  prophecy: string;
  backgroundColor: string;
  textColor: string;
};

const ComputedProphecyView = (props: Props) => {
  const {prophecy, backgroundColor, textColor} = props;

  return (
    <View>
      <Text style={{...styles.titleText, ...textStyleCommon, color: textColor}}>
        🔮 your prophecy 🔮
      </Text>
      <View
        style={{
          ...styles.prophecyContainer,
          backgroundColor,
        }}>
        <Text
          style={{
            ...styles.prophecyText,
            ...textStyleCommon,
            color: textColor,
          }}>
          {prophecy}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingBottom: 16,
    textAlign: 'center',
  },
  prophecyContainer: {
    flexDirection: 'column',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  prophecyText: {
    fontSize: 20,
    fontWeight: '200',
  },
});

export default ComputedProphecyView;
