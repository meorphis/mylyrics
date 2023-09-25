import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {textStyleCommon} from '../../utility/helpers/text';

type Props = {
  prophecy: string;
  backgroundColor: string;
  textColor: string;
};

// view to show once a prophecy has been computed
const ComputedProphecyView = (props: Props) => {
  const {prophecy, backgroundColor, textColor} = props;

  return (
    <View>
      <Text style={{...textStyleCommon, ...styles.titleText, color: textColor}}>
        🔮 your prophecy 🔮
      </Text>
      <View
        style={{
          ...styles.prophecyContainer,
          backgroundColor,
        }}>
        <Text
          style={{
            ...textStyleCommon,
            ...styles.prophecyText,
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
