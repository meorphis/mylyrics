import { useSelector } from "react-redux";
import { RootState } from "..";
import _ from "lodash";
import { getIsFlippedKey } from "./util";
import { isDeckReadyForDisplay } from "../../helpers/deck";

export const useShouldAutoFlip = ({bundleKey, passageKey}: {bundleKey: string, passageKey: string}) => {
    return useSelector(
        (state: RootState) => {
            const passages = state.bundles.bundles[bundleKey].passages;
            return state.cardFlip.should_autoflip &&
                state.bundles.activeBundleKey === bundleKey &&
                state.bundles.bundleKeyToPassageKey[bundleKey] === passageKey
        }
    );
};

export const useIsFlipped = ({bundleKey, passageKey}: {bundleKey: string, passageKey: string}) => {
    const key = getIsFlippedKey({bundleKey, passageKey})
    return useSelector(
        (state: RootState) => state.cardFlip.is_flipped[key]
    )
}
