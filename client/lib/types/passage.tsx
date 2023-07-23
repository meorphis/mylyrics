import {RequestTypeWithPartial} from './request';
import SongType from './song';
import TagType from './tag';

export type PassageType = {
  lyrics: string;
  tags: TagType[];
  song: SongType;
};

export type PassageGroupType = {
  [passageKey: string]: PassageType;
};

export type PassageGroupsType = {
  [groupKey: string]: PassageGroupType;
};

export type PassageGroupRequestType = RequestTypeWithPartial<PassageGroupType>;

export type PassageGroupsDataType = {
  [groupKey: string]: PassageGroupRequestType;
};

export type PassageItemKey = {
  groupKey: string;
  passageKey: string;
};
