import React from 'react';
import {useTheme} from '../../utility/theme';
import {addColorOpacity, isColorLight} from '../../utility/color';
import LoadingIndicator from '../common/LoadingIndicator';

type Props = {
  noun: string;
};

const ThemedLoadingIndicator = (props: Props) => {
  const {noun} = props;

  const {theme} = useTheme();
  const color = isColorLight(addColorOpacity(theme.backgroundColor, 0.6))
    ? 'black'
    : 'white';

  return <LoadingIndicator noun={noun} color={color} />;
};

export default ThemedLoadingIndicator;
