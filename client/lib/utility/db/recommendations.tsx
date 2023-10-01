import {useEffect, useRef, useState} from 'react';
import {useDeviceId} from '../contexts/device_id';
import db from './firestore';
import {
  doc,
  collection,
  getDoc,
  DocumentSnapshot,
  DocumentData,
  onSnapshot,
  Unsubscribe,
} from '@firebase/firestore';
import {RequestTypeWithPendingReload} from '../../types/request';
import {useDispatch} from 'react-redux';
import {errorToString} from '../helpers/error';
import {RawPassageType} from '../../types/passage';
import {setProphecy} from '../redux/prophecy/slice';
import {getBundlesFromFlatPassages} from '../helpers/recommendations';
import {addBundles, setActiveBundlePassage} from '../redux/bundles/slice';
import {CacheManager} from '@georstat/react-native-image-cache';
import {AppState} from 'react-native';

// returns:
// - the current status of fetching recommendations from firestore
// - a function to make a request when we initially want to get recommendations
// - a function to apply a pending reload (if one exists) when the data displayed is stale
// for each recommendation, and dispatches the data to the redux store;
// recommendationsRequest.data is true if recommendations were found, false otherwise
export const useRecommendationsRequest = () => {
  const [recommendationsRequest, setRecommendationsRequest] = useState<
    RequestTypeWithPendingReload<number, DocumentSnapshot>
  >({
    status: 'init',
  });

  const deviceId = useDeviceId();
  const setupRecommendations = useSetupRecommendations();

  const getRecommendationsFromFirestore = async () => {
    return await getDoc(doc(collection(db, 'user-recommendations'), deviceId));
  };

  // if we have updates to apply, it's ok to apply them as long as they are different
  // from the data already in the redux store
  const shouldSetRecommendations = (docSnap: DocumentSnapshot) => {
    return (
      recommendationsRequest.status !== 'loaded' ||
      docSnap.data()?.lastRefreshedAt !== recommendationsRequest.data
    );
  };

  const maybeSetRecommendations = async (docSnap: DocumentSnapshot) => {
    if (shouldSetRecommendations(docSnap)) {
      const recommendationsExist = await setupRecommendations({docSnap});
      setRecommendationsRequest({
        status: 'loaded',
        data: recommendationsExist ? docSnap.data()?.lastRefreshedAt : null,
      });
    }
  };

  // function to update the recommendations if there is new data and then continuously
  // check for updates by subscribing to the user-recommendations document in firestore
  // called when the app first starts up and when the app comes into the foreground
  const unsubscribe = useRef<Unsubscribe | null>(null);
  const maybeUpdateThenContinuouslyCheckForUpdates = async () => {
    try {
      const docSnap = await getRecommendationsFromFirestore();
      await maybeSetRecommendations(docSnap);
    } catch (e) {
      console.error(e);
      setRecommendationsRequest({
        status: 'error',
        error: errorToString(e),
      });
    }

    // we should have already unsubscribed when the app went into the background,
    // but just in case, unsubscribe again
    if (unsubscribe.current) {
      unsubscribe.current();
    }
    unsubscribe.current = onSnapshot(
      doc(collection(db, 'user-recommendations'), deviceId),
      d => {
        if (
          recommendationsRequest.status === 'loaded' &&
          shouldSetRecommendations(d)
        ) {
          setRecommendationsRequest({
            status: 'pending_reload',
            data: recommendationsRequest.data,
            reloadData: d,
          });
        }
      },
    );
  };

  const appState = useRef(AppState.currentState);
  const [_, setAppState] = useState(appState.current);

  // when the app comes into the foreground:
  // - if there's already a pending update, just apply it
  // - otherwise, check for updates continuously
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          if (recommendationsRequest.status === 'loaded') {
            maybeUpdateThenContinuouslyCheckForUpdates();
          } else if (recommendationsRequest.status === 'pending_reload') {
            await applyPendingReload();
            maybeUpdateThenContinuouslyCheckForUpdates();
          }
        }

        if (
          appState.current === 'active' &&
          nextAppState.match(/inactive|background/)
        ) {
          if (unsubscribe.current) {
            unsubscribe.current();
            unsubscribe.current = null;
          }
        }

        appState.current = nextAppState;
        setAppState(appState.current);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const makeRecommendationsRequest = async () => {
    setRecommendationsRequest({status: 'loading'});
    maybeUpdateThenContinuouslyCheckForUpdates();
  };

  const applyPendingReload = async () => {
    if (recommendationsRequest.status !== 'pending_reload') {
      return;
    }
    maybeSetRecommendations(recommendationsRequest.reloadData);
  };

  return {
    recommendationsRequest,
    makeRecommendationsRequest,
    applyPendingReload,
  };
};

const useSetupRecommendations = () => {
  const dispatch = useDispatch();

  const setupRecommendations = async ({
    docSnap,
  }: {
    docSnap: DocumentSnapshot<DocumentData, DocumentData>;
  }) => {
    if (!docSnap.exists()) {
      return false;
    }

    const data = docSnap.data();

    const recommendations = data.recommendations as RawPassageType[];
    const sentiments = data.sentiments as string[];
    const prophecy = data.prophecy as string;

    await CacheManager.clearCache();
    const bundles = await getBundlesFromFlatPassages(
      recommendations,
      sentiments,
    );

    dispatch({type: 'RESET_RECOMMENDATIONS'});
    dispatch(addBundles(bundles));
    dispatch(setActiveBundlePassage(bundles[0].passages[0]));
    dispatch(setProphecy(prophecy ?? null));

    return true;
  };

  return setupRecommendations;
};
