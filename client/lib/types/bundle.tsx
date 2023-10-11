import {PassageType} from './passage';

// metadata attached to a bundle
export type BundleInfo =
  | {
      type: 'sentiment';
      key: string;
      sentiment: string;
      group: string;
      value: 'positive' | 'negative' | 'mixed';
    }
  | {
      type: 'top';
      key: 'top';
      group: 'essentials';
    }
  | {
      type: 'artist';
      key: string;
      group: 'featured';
      artist: {
        name: string;
        emoji: string;
      };
    }
  | {
      type: 'likes';
      key: 'likes';
      group: 'essentials';
    }
  | {
      type: 'user_made';
      key: string;
      group: undefined;
      title: string;
      creator: {
        id: string;
        nickname: string;
      };
      recipient?: {
        nickname: string;
      };
    }
  | {
      type: 'singleton';
      key: 'singleton';
      group: undefined;
    };

// a passage that is part of a bundle
export type BundlePassageType = PassageType & {
  bundleKey: string;
  sortKey: number | string;
};

// a deck of lyric passages with metadata
export type BundleType = {
  passages: BundlePassageType[];
  info: BundleInfo;
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
    [bundleKey: string]: string | null;
  };
};
