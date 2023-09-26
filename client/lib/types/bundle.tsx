import {PassageType} from './passage';

// a passage that is part of a bundle
export type BundlePassageType = PassageType & {
  bundleKey: string;
  sortKey: number | string;
};

// a deck of lyric passages with metadata
export type BundleType = {
  bundleKey: string;
  creator:
    | {
        type: 'user';
        id: string;
        nickname: string;
      }
    | {
        type: 'machine';
      };
  passages: BundlePassageType[];
  groupName?: string;
  title?: string;
  sortOrder?: 'asc' | 'desc';
};

// the bundles that are loaded in the client, along with the bundle that should
// currently be displayed in the UI, as well as a map indicating the passage that
// is active within each bundle
export type BundlesState = {
  bundles: {[bundleKey: string]: BundleType};
  activeBundleKey: string;
  // slightly delayed after activeBundleKey changes, this is set once the animations
  // are ready and we actually want to scroll
  scrollToBundleIndex: number;
  // used for the back button
  previousActiveBundleKey: string | null;
  bundleKeyToPassageKey: {
    [bundleKey: string]: string;
  };
};
