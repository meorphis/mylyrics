import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {textStyleCommon} from '../../utility/helpers/text';
import {ScrollView} from 'react-native-gesture-handler';

type Props = {
  prophecy: string;
};

// view to show once a prophecy has been computed
const ComputedProphecyView = (props: Props) => {
  const {prophecy} = props;

  return (
    <ScrollView style={styles.container}>
      <Text style={{...textStyleCommon, ...styles.titleText}}>
        🔮 your prophecy 🔮
      </Text>
      <View
        style={{
          ...styles.prophecyContainer,
        }}>
        <Text
          style={{
            ...textStyleCommon,
            ...styles.prophecyText,
          }}>
          {prophecy}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  prophecyContainer: {
    padding: 24,
  },
  prophecyText: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '300',
    textAlign: 'center',
  },
});

export default ComputedProphecyView;
