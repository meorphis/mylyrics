import {PayloadAction, Reducer, createSlice} from '@reduxjs/toolkit';
import {
  BundlePassageType,
  BundleType,
  BundlesState,
} from '../../../types/bundle';

// allows adding bundles, adding or removing passages from bundles, and
// marking a bundle and/or a passage within a bundle as currently active
export const bundlesSlice = createSlice({
  name: 'bundles',
  initialState: {
    bundles: {},
    bundleKeyToPassageKey: {},
  } as BundlesState,
  reducers: {
    addBundles: (state: BundlesState, action: PayloadAction<BundleType[]>) => {
      action.payload.forEach(bundle => {
        if (bundle.bundleKey in state) {
          throw Error(`${bundle.bundleKey} already exists in bundles state`);
        }
        state.bundles[bundle.bundleKey] = bundle;
        state.bundleKeyToPassageKey[bundle.bundleKey] =
          bundle.passages[0].passageKey;
      });
    },
    addToBundle: (
      state: BundlesState,
      action: PayloadAction<BundlePassageType>,
    ) => {
      const passage = action.payload;

      const bundle = state.bundles[passage.bundleKey];
      if (!bundle) {
        throw Error(`${passage.bundleKey} does not exist in bundles state`);
      }
      const sortOrder = bundle.sortOrder || 'asc';
      const index = bundle.passages.findIndex(p =>
        sortOrder === 'asc'
          ? p.sortKey > passage.sortKey
          : p.sortKey < passage.sortKey,
      );
      if (index === -1) {
        bundle.passages.push(passage);
      } else {
        bundle.passages = [
          ...bundle.passages.slice(0, index),
          passage,
          ...bundle.passages.slice(index),
        ];
      }
    },
    removeFromBundle: (
      state: BundlesState,
      action: PayloadAction<{
        bundleKey: string;
        passageKey: string;
      }>,
    ) => {
      const {bundleKey, passageKey} = action.payload;
      const bundle = state.bundles[bundleKey];
      if (!bundle) {
        throw Error(`${bundleKey} does not exist in bundles state`);
      }
      const index = bundle.passages.findIndex(p => p.passageKey === passageKey);
      if (index === -1) {
        throw Error(`${passageKey} does not exist in ${bundleKey}`);
      }
      bundle.passages = [
        ...bundle.passages.slice(0, index),
        ...bundle.passages.slice(index + 1),
      ];

      // keep the same index (or zero if the index is now out of bounds) to
      // essentially go to the next passage
      if (state.bundleKeyToPassageKey[bundleKey] === passageKey) {
        state.bundleKeyToPassageKey[bundleKey] =
          bundle.passages[index % bundle.passages.length].passageKey;
      }
    },
    setActiveBundlePassage: (
      state: BundlesState,
      action: PayloadAction<BundlePassageType>,
    ) => {
      const currentlyActiveBundleKey = state.activeBundleKey;

      const {bundleKey, passageKey} = action.payload;

      // TODO: clean this up
      if (bundleKey === 'singleton_passage') {
        state.bundles.singleton_passage = {
          bundleKey: 'singleton_passage',
          passages: [action.payload],
          creator: {type: 'machine'},
        };
      } else {
        state.bundles.singleton_passage = {
          bundleKey: 'singleton_passage',
          passages: [],
          creator: {type: 'machine'},
        };
      }

      state.activeBundleKey = bundleKey;

      if (passageKey) {
        state.bundleKeyToPassageKey[state.activeBundleKey] = passageKey;
      }

      if (currentlyActiveBundleKey !== bundleKey) {
        state.previousActiveBundleKey = currentlyActiveBundleKey;
      }
    },
    setScrollToBundleIndex: (
      state: BundlesState,
      action: PayloadAction<number>,
    ) => {
      state.scrollToBundleIndex = action.payload;
    },
  },
});

export const {
  addBundles,
  addToBundle,
  removeFromBundle,
  setActiveBundlePassage,
  setScrollToBundleIndex,
} = bundlesSlice.actions;

export default bundlesSlice.reducer as Reducer<BundlesState>;
