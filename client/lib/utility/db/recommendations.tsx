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
import {useDispatch} from 'react-redux';
import {RawPassageType} from '../../types/passage';
import {resetProphecyState} from '../redux/prophecy/slice';
import {getBundlesFromFlatPassages} from '../helpers/recommendations';
import {addBundles, setActiveBundlePassage} from '../redux/bundles/slice';
import {CacheManager} from '@georstat/react-native-image-cache';
import {AppState} from 'react-native';
import {usePassageHydration} from '../helpers/passage';
import {BundlePassageType} from '../../types/bundle';
import {setTopSentiments} from '../redux/stats/slice';

// returns:
// - the current status of fetching recommendations from firestore
// - a function to make a request when we initially want to get recommendations
// - a function to apply a pending reload (if one exists) when the data displayed is stale
// for each recommendation, and dispatches the data to the redux store;
// recommendationsRequest.data is true if recommendations were found, false otherwise
export const useRecommendationsRequest = () => {
  const recommendationsRequestStatus = useRef<
    | 'init'
    | 'loading'
    | 'loaded_with_data'
    | 'loaded_with_no_data'
    | 'error'
    | 'pending_reload'
  >('init');
  const [_, setRecommendationsRequestStatus] = useState(
    recommendationsRequestStatus.current,
  );
  const lastRefreshedAt = useRef<number | null>(null);
  const reloadData = useRef<DocumentSnapshot | null>(null);

  const deviceId = useDeviceId();
  const setupRecommendations = useSetupRecommendations();

  const getRecommendationsFromFirestore = async () => {
    return await getDoc(doc(collection(db, 'user-recommendations'), deviceId));
  };

  // returns true if there is data in the document and it's different from the data
  // that is currently loaded
  const isNewDataAvailable = ({newSnap}: {newSnap: DocumentSnapshot}) => {
    const newLastRefreshedAt = newSnap.data()?.lastRefreshedAt;
    return (
      newLastRefreshedAt != null &&
      newLastRefreshedAt !== lastRefreshedAt.current
    );
  };

  // when the app comes into focus (either cold start or foregrounding), we should update
  // the recommendations if either no recommendations are set yet or the data that is set is
  // stale
  const shouldUpdateRecommendationsOnFocus = (docSnap: DocumentSnapshot) => {
    // if there is data loaded, only set new data if it's different from the old data
    return isNewDataAvailable({newSnap: docSnap});
  };

  const setRecommendations = async (docSnap: DocumentSnapshot) => {
    // update the status to loading, since we're about to load new data
    recommendationsRequestStatus.current = 'loading';
    setRecommendationsRequestStatus('loading');
    const recommendationsExist = await setupRecommendations({docSnap});

    // after we've loaded the data and set it up, update the lastRefreshedAt and status
    lastRefreshedAt.current = docSnap.data()?.lastRefreshedAt;
    recommendationsRequestStatus.current = recommendationsExist
      ? 'loaded_with_data'
      : 'loaded_with_no_data';
    setRecommendationsRequestStatus(
      recommendationsExist ? 'loaded_with_data' : 'loaded_with_no_data',
    );
  };

  // function to update the recommendations if there is new data and then continuously
  // check for updates by subscribing to the user-recommendations document in firestore;
  // called when the app first starts up and when the app comes into the foreground
  const maybeUpdateThenContinuouslyCheckForUpdatesOnFocus = async ({
    isInitialLoad,
  }: {
    isInitialLoad: boolean;
  }) => {
    try {
      const docSnap = await getRecommendationsFromFirestore();

      if (isInitialLoad || shouldUpdateRecommendationsOnFocus(docSnap)) {
        await setRecommendations(docSnap);
      }
    } catch (e) {
      console.error(e);
      // do not worry about errors if it's not a cold start, since we can just continue
      // to display whatever we're currently displaying
      if (isInitialLoad) {
        recommendationsRequestStatus.current = 'error';
        setRecommendationsRequestStatus('error');
      }
    }
    await continuouslyCheckForUpdates();
  };

  const unsubscribe = useRef<Unsubscribe | null>(null);
  const continuouslyCheckForUpdates = async () => {
    // we should have already unsubscribed when the app went into the background,
    // but just in case, unsubscribe again
    if (unsubscribe.current) {
      unsubscribe.current();
    }
    unsubscribe.current = onSnapshot(
      doc(collection(db, 'user-recommendations'), deviceId),
      d => {
        if (
          recommendationsRequestStatus.current === 'loaded_with_data' &&
          isNewDataAvailable({newSnap: d})
        ) {
          // if we have data but it's stale, do not immediately refresh as this could disrupt the user's experience
          // instead - mark it as pending and wait until either user manually refreshes or app leaves the foreground
          // and then comes back into the foreground
          recommendationsRequestStatus.current = 'pending_reload';
          reloadData.current = d;
          setRecommendationsRequestStatus('pending_reload');
        } else if (
          // if we don't actually have data yet, we can just update immediately
          ['loaded_with_no_data', 'error'].includes(
            recommendationsRequestStatus.current,
          ) &&
          isNewDataAvailable({newSnap: d})
        ) {
          setRecommendations(d);
        }
      },
    );
  };

  const appState = useRef(AppState.currentState);
  const [__, setAppState] = useState(appState.current);

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
          if (recommendationsRequestStatus.current.startsWith('loaded')) {
            await maybeUpdateThenContinuouslyCheckForUpdatesOnFocus({
              isInitialLoad: false,
            });
          } else if (
            recommendationsRequestStatus.current === 'pending_reload'
          ) {
            await applyPendingReload();
            await continuouslyCheckForUpdates();
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
    recommendationsRequestStatus.current = 'loading';
    setRecommendationsRequestStatus('loading');
    maybeUpdateThenContinuouslyCheckForUpdatesOnFocus({isInitialLoad: true});
  };

  const applyPendingReload = async () => {
    if (
      recommendationsRequestStatus.current !== 'pending_reload' ||
      !reloadData.current
    ) {
      return;
    }
    await setRecommendations(reloadData.current);
  };

  return {
    recommendationsRequestStatus: recommendationsRequestStatus.current,
    makeRecommendationsRequest,
    applyPendingReload,
  };
};

const useSetupRecommendations = () => {
  const dispatch = useDispatch();
  const hydratePassages = usePassageHydration();

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
    const recommendationSentiments = data.recommendationSentiments as string[];

    await CacheManager.clearCache();
    const bundles = await getBundlesFromFlatPassages(
      recommendations,
      recommendationSentiments,
    );

    const firstBundle = bundles[0];

    await hydratePassages(firstBundle.passages);

    dispatch({type: 'RESET_RECOMMENDATIONS'});
    dispatch(addBundles(bundles));
    dispatch(
      setActiveBundlePassage(bundles[0].passages[0] as BundlePassageType),
    );
    dispatch(resetProphecyState());
    dispatch(setTopSentiments(data.topSentiments));

    return true;
  };

  return setupRecommendations;
};
