import {v5 as uuidv5} from 'uuid';
import {PassageType, RawPassageType} from '../types/passage';

export const getPassageId = (passage: PassageType | RawPassageType): string => {
  return uuidv5(
    passage.song.id + passage.lyrics,
    '3f6d2929-046d-41bd-87d2-630373a17e63',
  );
};
