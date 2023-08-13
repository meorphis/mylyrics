import {CacheManager} from '@georstat/react-native-image-cache';
import {getColors} from 'react-native-image-colors';
import {addImageData} from './redux/image_data';
import {useDispatch} from 'react-redux';

export const useCacheImageDataForUrls = () => {
  const dispatch = useDispatch();

  const cacheImageDataForUrls = async (urls: string[]) => {
    const imageData = await Promise.all(Array.from(urls).map(fetchImageData));
    dispatch(addImageData(imageData.filter(Boolean) as any));
  };

  return cacheImageDataForUrls;
};

const fetchImageData = async (url: string) => {
  const blob =
    'data:image/jpeg;base64,' + (await CacheManager.prefetchBlob(url!, {}));
  if (blob == null) {
    return null;
  }
  const colors = await getColors(blob, {quality: 'high'});
  return {
    url,
    blob,
    colors,
  };
};
