import {RequestTypeWithPartial} from './request';
import {RawSongType, SongType} from './song';
import TagType from './tag';
import ThemeType from './theme';

export type RawPassageType = {
  lyrics: string;
  tags: TagType[];
  song: RawSongType;
};

export type PassageType = {
  lyrics: string;
  tags: TagType[];
  song: SongType;
  theme: ThemeType;
};

export type PassageGroupType = {
  passageKey: string;
  passage: PassageType;
}[];

export type PassageGroupsType = {
  groupKey: string;
  passageGroup: PassageGroupType;
}[];

export type PassageGroupRequestType = RequestTypeWithPartial<PassageGroupType>;

export type PassageGroupRequestsType = {
  groupKey: string;
  passageGroupRequest: PassageGroupRequestType;
}[];

export type PassageItemKeyType = {
  groupKey: string;
  passageKey: string | null;
};
