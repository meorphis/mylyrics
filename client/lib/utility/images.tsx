import {CacheManager} from '@georstat/react-native-image-cache';

export const getImageBlobsForUrls = async (urls: string[]) => {
  const start = Date.now();
  const imageBlobs = await Promise.all(Array.from(urls).map(fetchImageBlobs));
  console.log(`fetching ${urls.length} images took ${Date.now() - start}ms`);
  return imageBlobs;
};

const fetchImageBlobs = async (url: string) => {
  const blob =
    'data:image/jpeg;base64,' + (await CacheManager.prefetchBlob(url!, {}));
  return blob;
};
