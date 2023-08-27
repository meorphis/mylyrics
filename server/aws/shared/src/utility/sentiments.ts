export const SENTIMENT_GROUPS = {
  body: [
    "celebratory",
    "energetic",
    "excited",
    "liberating",
    "reckless",
    "violent",
  ],
  eyes: [
    "alienated",
    "dreamy",
    "enigmatic",
    "hopeful",
    "lonely",
    "nostalgic",
    "optimistic",
  ],
  gut: [
    "betrayed",
    "bittersweet",
    "desperate",
    "frustrated",
    "melancholic",
    "vulnerable",
  ],
  heart: [
    "affectionate",
    "appreciative",
    "heartbroken",
    "intimate",
    "loyal",
    "romantic",
    "passionate",
  ],
  mind: [
    "chaotic",
    "conflicted",
    "determined",
    "disillusioned",
    "introspective",
    "obsessive",
    "philosophical",
    "regretful",
  ],
  skin: [
    "flirtatious",
    "lustful",
    "playful",
    "provocative",
    "seductive",
    "sensual",
  ],
  soul: [
    "carefree",
    "euphoric",
    "joyful",
    "peaceful",
    "rebellious",
    "spiritual",
    "surreal",
  ],
  spine: ["angry", "empowered", "fearful", "resilient", "triumphant"],
};

export const SENTIMENT_TO_GROUP = Object.entries(SENTIMENT_GROUPS).reduce(
  (acc, [group, sentiments]) => {
    sentiments.forEach((sentiment) => {
      acc[sentiment] = group;
    });
    return acc;
  },
  {} as Record<string, string>
);

export const VALID_SENTIMENTS = Object.values(SENTIMENT_GROUPS).flat();