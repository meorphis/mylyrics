import React from 'react';
import {Text} from 'react-native';

type Props = {
  dataStatus: 'loading' | 'error';
};

const NonLoadedPassageItem = (props: Props) => {
  return <Text>{props.dataStatus}</Text>;
};

export default NonLoadedPassageItem;
