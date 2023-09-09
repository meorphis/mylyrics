import {WalkthroughStep, WalkthroughStepStatus} from '../types/walkthrough';
import {useMMKVStorage} from 'react-native-mmkv-storage';
import {mmkvStorage} from './local_storage';
import {
  setWalkthroughStepStateAsCompleted,
  setWalkthroughStepStateAsReady,
} from './redux/walkthrough';
import {useState} from 'react';

export const useWalkthroughStep = (step: WalkthroughStep) => {
  const [status, setStatus] = useMMKVStorage<WalkthroughStepStatus>(
    `walkthrough.${step}`,
    mmkvStorage,
    'hidden',
  );

  const setStatusAsCompleted = () => {
    if (status === 'completed') {
      return;
    }

    setStatus('completed');
    setWalkthroughStepStateAsCompleted(step);
  };

  const setStatusAsReady = () => {
    if (status === 'ready') {
      return;
    }

    setStatus('ready');
    setWalkthroughStepStateAsReady(step);
  };

  return {
    walkthroughStepStatus: status,
    setWalkthroughStepAsCompleted: setStatusAsCompleted,
    setWalkthroughStepAsReady: setStatusAsReady,
  };
};

export const useUpdateSequentialWalkthroughStep = () => {
  const {
    walkthroughStepStatus: exploreStepStatus,
    setWalkthroughStepAsReady: setExploreStepAsReady,
  } = useWalkthroughStep('explore');

  const {
    walkthroughStepStatus: likeStepStatus,
    setWalkthroughStepAsReady: setLikeStepAsReady,
  } = useWalkthroughStep('like');

  const {
    walkthroughStepStatus: drawStepStatus,
    setWalkthroughStepAsReady: setDrawStepAsReady,
  } = useWalkthroughStep('draw');

  const {
    walkthroughStepStatus: fullLyricsStepStatus,
    setWalkthroughStepAsReady: setFullLyricsStepAsReady,
  } = useWalkthroughStep('full_lyrics');

  const [counter, setCounter] = useState(0);

  const updateSequentialWalkthroughStep = () => {
    if (counter === 2) {
      if (exploreStepStatus === 'hidden') {
        setExploreStepAsReady();
      } else if (likeStepStatus === 'hidden') {
        setLikeStepAsReady();
      } else if (drawStepStatus === 'hidden') {
        setDrawStepAsReady();
      } else if (fullLyricsStepStatus === 'hidden') {
        setFullLyricsStepAsReady();
      }
      setCounter(0);
    } else {
      setCounter(c => c + 1);
    }
  };

  return updateSequentialWalkthroughStep;
};
