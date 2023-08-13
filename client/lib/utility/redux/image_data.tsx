import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {ImageColorsResult} from 'react-native-image-colors';

type ImageDataType = {
  url: string;
  blob: string;
  colors: ImageColorsResult;
};

export const imageDataSlice = createSlice({
  name: 'image_data',
  initialState: {},
  reducers: {
    addImageData: (
      state: {
        [url: string]: ImageDataType;
      },
      action: PayloadAction<
        {
          url: string;
          blob: string;
          colors: ImageColorsResult;
        }[]
      >,
    ) => {
      action.payload.forEach(imageData => {
        state[imageData.url] = imageData;
      });
    },
  },
});

export const {addImageData} = imageDataSlice.actions;

export default imageDataSlice.reducer as Reducer<{
  [url: string]: ImageDataType;
}>;
