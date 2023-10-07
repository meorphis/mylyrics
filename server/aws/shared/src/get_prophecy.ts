import { computeProphecy } from "./integrations/llm/open_ai_integration";
import { Recommendation } from "./utility/types";

/// *** PUBLIC INTERFACE ***
// takes as input a list of passage recommendations and returns a "prophecy"
export const getProphecy = async (
  {passages} : {passages: Recommendation[]}
): Promise<string> => {
  return computeProphecy({passages});
}
