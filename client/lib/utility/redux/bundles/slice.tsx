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
        if (bundle.info.key in state) {
          throw Error(`${bundle.info.key} already exists in bundles state`);
        }
        state.bundles[bundle.info.key] = bundle;
        state.bundleKeyToPassageKey[bundle.info.key] =
          bundle.passages[0]?.passageKey ?? null;
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

      const existingPassages = bundle.passages;

      if (index === -1) {
        existingPassages.push(passage);
      } else {
        bundle.passages = [
          ...existingPassages.slice(0, index),
          passage,
          ...existingPassages.slice(index),
        ];
      }
      state.bundleKeyToPassageKey[passage.bundleKey] = passage.passageKey;
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
      action: PayloadAction<{
        bundlePassage: BundlePassageType;
        deferToTypes?: string[];
      }>,
    ) => {
      const {bundlePassage, deferToTypes} = action.payload;

      const currentlyActiveBundleKey = state.activeBundleKey;
      const currentlyActiveBundle = state.bundles[currentlyActiveBundleKey];

      if (
        deferToTypes &&
        deferToTypes.includes(currentlyActiveBundle?.info.type)
      ) {
        state.previousActiveBundleKey = bundlePassage.bundleKey;
        return;
      }

      const {bundleKey, passageKey} = bundlePassage;

      // TODO: clean this up
      if (bundleKey === 'singleton') {
        state.bundles.singleton = {
          passages: [bundlePassage as BundlePassageType],
          info: {
            group: undefined,
            key: 'singleton',
            type: 'singleton',
          },
        };
      } else {
        state.bundles.singleton = {
          passages: [],
          info: {
            group: undefined,
            key: 'singleton',
            type: 'singleton',
          },
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
    setEmptyBundle: (
      state: BundlesState,
      action: PayloadAction<{bundleKey: string}>,
    ) => {
      state.activeBundleKey = action.payload.bundleKey;
      state.bundleKeyToPassageKey[action.payload.bundleKey] = null;
    },
    setScrollToBundleIndex: (
      state: BundlesState,
      action: PayloadAction<number>,
    ) => {
      state.scrollToBundleIndex = action.payload;
    },
    resetRecommendations: (state: BundlesState) => {
      Object.entries(state.bundles).forEach(([bundleKey, bundle]) => {
        if (['top', 'artist', 'sentiment'].includes(bundle.info.type)) {
          delete state.bundles[bundleKey];
          delete state.bundleKeyToPassageKey[bundleKey];
        }
      });
    },
  },
});

export const {
  addBundles,
  addToBundle,
  removeFromBundle,
  setActiveBundlePassage,
  setEmptyBundle,
  setScrollToBundleIndex,
} = bundlesSlice.actions;

export default bundlesSlice.reducer as Reducer<BundlesState>;
