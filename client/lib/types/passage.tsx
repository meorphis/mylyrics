import {RequestTypeWithPartial} from './request';
import SongType from './song';
import TagType from './tag';

export type PassageType = {
  lyrics: string;
  tags: TagType[];
  song: SongType;
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
  passageKey: string;
};
