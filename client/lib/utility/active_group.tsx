// import {useDispatch, useSelector} from 'react-redux';
// import {RootState} from './redux';
// import {setActivePassage} from './redux/active_passage';
// import {
//   addLoadedPassageGroups,
//   markPassageGroupAsError,
//   markPassageGroupAsLoading,
// } from './redux/recommendations';
// import {errorToString} from './error';
// import {
//   PassageGroupRequestsType,
//   PassageItemKeyType,
//   RawPassageType,
// } from '../types/passage';
// import {useDeviceId} from './device_id';
// import {updateImpressions} from './db/recommendations';
// import {API_HOST} from './api';
// import {useEffect} from 'react';
// import _ from 'lodash';
// import {useNavigation} from '@react-navigation/native';
// import {getPassageGroups} from './recommendations';

// const findFirstPassageKey = (
//   gk: string,
//   passages: PassageGroupRequestsType,
// ) => {
//   return passages.find(({groupKey}) => gk === groupKey)?.passageGroupRequest
//     .data[0]?.passageKey;
// };

// export const useSetAsActiveGroup = (passage: PassageItemKeyType) => {
//   const navigation = useNavigation();
//   const passageGroupKeyIsUninitialized = useSelector(
//     (state: RootState) =>
//       state.recommendations.find(({groupKey}) => groupKey === passage.groupKey)
//         ?.passageGroupRequest.status === 'init',
//   );
//   const activeGroupKey = useSelector(
//     (state: RootState) => state.activePassage?.groupKey,
//   );
//   const allSentiments = useSelector(
//     (state: RootState) => state.recommendations.map(({groupKey}) => groupKey),
//     _.isEqual,
//   );

//   const firstPassageKey = useSelector((state: RootState) =>
//     findFirstPassageKey(passage.groupKey, state.recommendations),
//   );

//   useEffect(() => {
//     if (
//       navigation.getId() === 'Main' &&
//       activeGroupKey === passage.groupKey &&
//       passage.passageKey == null
//     ) {
//       console.log(`set active passage ${activeGroupKey}, ${firstPassageKey}`);
//       if (firstPassageKey) {
//         dispatch(setActivePassage({passageKey: firstPassageKey}));
//       }
//     }
//   }, [firstPassageKey != null]);

//   const deviceId = useDeviceId();

//   const dispatch = useDispatch();

//   const setActiveGroup = async () => {
//     const {groupKey, passageKey} = passage;

//     dispatch(
//       setActivePassage({groupKey, passageKey: passageKey ?? firstPassageKey}),
//     );

//     if (passageGroupKeyIsUninitialized) {
//       dispatch(
//         markPassageGroupAsLoading({
//           groupKey,
//         }),
//       );
//       try {
//         const recommendationsResponse = await fetch(
//           `${API_HOST}/get_additional_recommendations?userId=${deviceId}&sentiment=${groupKey}`,
//         );
//         const data = await recommendationsResponse.json();
//         const flatRecommendations = data.recommendations as RawPassageType[];

//         updateImpressions({deviceId, passages: flatRecommendations});

//         const recommendations = await getPassageGroups(
//           flatRecommendations,
//           allSentiments,
//         );

//         dispatch(addLoadedPassageGroups(recommendations));
//       } catch (e) {
//         dispatch(
//           markPassageGroupAsError({
//             groupKey,
//             error: errorToString(e),
//           }),
//         );
//       }
//     }
//   };

//   return setActiveGroup;
// };
