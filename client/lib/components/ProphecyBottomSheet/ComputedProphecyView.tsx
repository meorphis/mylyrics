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
  container: {
    marginTop: 12,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  prophecyContainer: {
    flexDirection: 'column',
    borderRadius: 30,
    margin: 12,
    marginTop: 18,
    marginBottom: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#00000040',
    borderWidth: 3,
    borderColor: '#00000040',
  },
  prophecyText: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '300',
    textAlign: 'center',
  },
});

export default ComputedProphecyView;
