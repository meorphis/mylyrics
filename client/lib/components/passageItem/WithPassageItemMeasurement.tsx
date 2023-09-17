import React from 'react';
import {PassageItemProps} from './PassageItem';
import {PassageItemMeasurementProvider} from '../../utility/max_size';
import {getPassageId} from '../../utility/passage_id';

export const WithPassageItemMeasurement = (
  WrappedComponent: React.ComponentType<PassageItemProps>,
) => {
  const MeasuredPassageItem = (props: PassageItemProps) => {
    return (
      <PassageItemMeasurementProvider passageId={getPassageId(props.passage)}>
        <WrappedComponent {...props} />
      </PassageItemMeasurementProvider>
    );
  };

  return MeasuredPassageItem;
};
