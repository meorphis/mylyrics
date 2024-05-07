export const getIsFlippedKey = ({
  bundleKey,
  passageKey,
}: {
  bundleKey: string;
  passageKey: string;
}) => `${bundleKey}:${passageKey}`;
