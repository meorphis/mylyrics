// Groups recommendations into "passage groups" based on sentiment; a passage

import {PassageGroupsType, PassageType, RawPassageType} from '../types/passage';
import {getImageBlobsForUrls} from './images';
import {getPassageId} from './passage_id';
import {getThemeFromAlbumColors} from './theme';

// can be in multiple groups, one for each sentiment it has
export const getPassageGroups = async (
  flatRecommendations: RawPassageType[],
  allSentiments: string[],
): Promise<PassageGroupsType> => {
  const blobs = await getImageBlobsForUrls(
    flatRecommendations.map(({song}) => song.album.image.url),
  );

  const themes = flatRecommendations.map(r =>
    getThemeFromAlbumColors(r.song.album.image.colors),
  );

  const flatRecommendationsWithBlobs: PassageType[] = flatRecommendations.map(
    (rec, index) => {
      return {
        ...rec,
        song: {
          ...rec.song,
          album: {
            ...rec.song.album,
            image: {
              ...rec.song.album.image,
              blob: blobs[index],
            },
          },
        },
        theme: themes[index],
      };
    },
  );

  const recommendations: PassageGroupsType = [];
  flatRecommendationsWithBlobs.forEach((rec: PassageType) => {
    rec.tags.forEach(({sentiment}) => {
      const cleanedRec = {
        ...rec,
        tags: rec.tags.filter(({sentiment: s}) => allSentiments.includes(s)),
      };

      if (!allSentiments.includes(sentiment)) {
        return;
      }

      let passageGroup = recommendations.find(
        ({groupKey}) => groupKey === sentiment,
      )?.passageGroup;
      if (passageGroup == null) {
        passageGroup = [];
        recommendations.push({
          groupKey: sentiment,
          passageGroup,
        });
      }

      passageGroup.push({
        passageKey: getPassageId(cleanedRec),
        passage: cleanedRec,
      });
    });
  });

  return recommendations;
};
