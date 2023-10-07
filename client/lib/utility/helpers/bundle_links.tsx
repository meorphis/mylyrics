import {useEffect} from 'react';
import {Linking} from 'react-native';
import db from '../db/firestore';
import {doc, getDoc} from '@firebase/firestore';
import {useDispatch} from 'react-redux';
import {RawPassageType} from '../../types/passage';
import {hydratePassage} from './passage';
import {addBundles} from '../redux/bundles/slice';
import {BundleType} from '../../types/bundle';
import {requestBundleChange} from '../redux/requested_bundle_change/slice';

// handler for bundles shared as links; loads the bundle from db, adds it to redux
// and sets it as the active bundle
export const useBundleLink = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleOpenURL = async (event: {url: string}) => {
      const url = event.url;

      let bundleKey: string | undefined;

      const [scheme, rest] = url.split('://');
      const pathSegments = rest.split('/');

      if (scheme === 'finelines' && pathSegments[0] === 'bundle') {
        bundleKey = pathSegments[1];
      }

      if (bundleKey === undefined) {
        return;
      }

      const d = await getDoc(doc(db, 'bundles', bundleKey!));

      if (!d.exists()) {
        return;
      }

      const data = d.data()! as {
        passages: RawPassageType[];
        creator: {
          id: string;
          nickname: string;
        };
        title: string;
        recipient?: {
          nickname: string;
        };
      };
      const {passages: rawPassages, creator, title} = data;
      const passages = await Promise.all(rawPassages.map(hydratePassage));
      const bundle: BundleType = {
        passages: passages.map((p, idx) => ({
          ...p,
          bundleKey: bundleKey!,
          sortKey: idx,
        })),
        info: {
          key: bundleKey!,
          type: 'user_made',
          group: undefined,
          creator,
          recipient: data.recipient,
          title,
        },
      };

      dispatch(addBundles([bundle]));
      dispatch(requestBundleChange({bundleKey}));
    };

    const linkingEvent = Linking.addEventListener('url', handleOpenURL);
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          handleOpenURL({url});
        }
      })
      .catch(err => {
        console.warn('An error occurred', err);
      });

    return () => {
      linkingEvent.remove();
    };
  }, []);
};
