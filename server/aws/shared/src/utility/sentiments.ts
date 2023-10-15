type Sentiment = {
  name: string;
  group: "body" | "eyes" | "gut" | "heart" | "mind" | "skin" | "soul" | "spine";
  value: "positive" | "negative" | "mixed";
}

// "value" here is a best guess as to whether an observer would be pleased or displeased
// at the notion of feeling this sentiment
const SENTIMENT_VALUES: Record<string, Sentiment> = {
  "affection": {
    name: "affection",
    group: "heart",
    value: "positive",
  },
  "alienation": {
    name: "alienation",
    group: "eyes",
    value: "negative",
  },
  "anger": {
    name: "anger",
    group: "spine",
    value: "negative",
  },
  "anxiety": {
    name: "anxiety",
    group: "mind",
    value: "negative",
  },
  "appreciation": {
    name: "appreciation",
    group: "heart",
    value: "positive",
  },
  "betrayal": {
    name: "betrayal",
    group: "gut",
    value: "negative",
  },
  "celebration": {
    name: "celebration",
    group: "body",
    value: "positive",
  },
  "chaos": {
    name: "chaos",
    group: "mind",
    value: "negative",
  },
  "confusion": {
    name: "confusion",
    group: "mind",
    value: "negative",
  },
  "curiosity": {
    name: "curiosity",
    group: "eyes",
    value: "positive",
  },
  "defiance": {
    name: "defiance",
    group: "spine",
    value: "positive",
  },
  "desperation": {
    name: "desperation",
    group: "gut",
    value: "negative",
  },
  "determination": {
    name: "determination",
    group: "mind",
    value: "positive",
  },
  "disgust": {
    name: "disgust",
    group: "gut",
    value: "negative",
  },
  "disillusionment": {
    name: "disillusionment",
    group: "mind",
    value: "negative",
  },
  "dreams": {
    name: "dreams",
    group: "eyes",
    value: "positive",
  },
  "empowerment": {
    name: "empowerment",
    group: "spine",
    value: "positive",
  },
  "energy": {
    name: "energy",
    group: "body",
    value: "positive",
  },
  "enigma": {
    name: "enigma",
    group: "eyes",
    value: "positive",
  },
  "euphoria": {
    name: "euphoria",
    group: "soul",
    value: "positive",
  },
  "excitement": {
    name: "excitement",
    group: "body",
    value: "positive",
  },
  "fear": {
    name: "fear",
    group: "spine",
    value: "negative",
  },
  "flirting": {
    name: "flirting",
    group: "skin",
    value: "positive",
  },
  "friendship": {
    name: "friendship",
    group: "heart",
    value: "positive",
  },
  "frustration": {
    name: "frustration",
    group: "gut",
    value: "negative",
  },
  "gloom": {
    name: "gloom",
    group: "eyes",
    value: "negative",
  },
  "heartbreak": {
    name: "heartbreak",
    group: "heart",
    value: "negative",
  },
  "hope": {
    name: "hope",
    group: "eyes",
    value: "positive",
  },
  "humor": {
    name: "humor",
    group: "gut",
    value: "positive",
  },
  "intimacy": {
    name: "intimacy",
    group: "heart",
    value: "positive",
  },
  "introspection": {
    name: "introspection",
    group: "mind",
    value: "positive",
  },
  "joy": {
    name: "joy",
    group: "soul",
    value: "positive",
  },
  "liberation": {
    name: "liberation",
    group: "body",
    value: "positive",
  },
  "loneliness": {
    name: "loneliness",
    group: "eyes",
    value: "negative",
  },
  "longing": {
    name: "longing",
    group: "eyes",
    value: "negative",
  },
  "love": {
    name: "love",
    group: "heart",
    value: "positive",
  },
  "loyalty": {
    name: "loyalty",
    group: "heart",
    value: "positive",
  },
  "lust": {
    name: "lust",
    group: "skin",
    value: "positive",
  },
  "melancholy": {
    name: "melancholy",
    group: "gut",
    value: "negative",
  },
  "memories": {
    name: "memories",
    group: "mind",
    value: "mixed",
  },
  "mystery": {
    name: "mystery",
    group: "eyes",
    value: "positive",
  },
  "obsession": {
    name: "obsession",
    group: "mind",
    value: "mixed",
  },
  "optimism": {
    name: "optimism",
    group: "eyes",
    value: "positive",
  },
  "passion": {
    name: "passion",
    group: "heart",
    value: "positive",
  },
  "peace": {
    name: "peace",
    group: "soul",
    value: "positive",
  },
  "philosophy": {
    name: "philosophy",
    group: "mind",
    value: "positive",
  },
  "play": {
    name: "play",
    group: "skin",
    value: "positive",
  },
  "provocation": {
    name: "provocation",
    group: "skin",
    value: "positive",
  },
  "rebellion": {
    name: "rebellion",
    group: "soul",
    value: "positive",
  },
  "recklessness": {
    name: "recklessness",
    group: "body",
    value: "mixed",
  },
  "regret": {
    name: "regret",
    group: "mind",
    value: "negative",
  },
  "resilience": {
    name: "resilience",
    group: "spine",
    value: "positive",
  },
  "romance": {
    name: "romance",
    group: "heart",
    value: "positive",
  },
  "seduction": {
    name: "seduction",
    group: "skin",
    value: "positive",
  },
  "sensuality": {
    name: "sensuality",
    group: "skin",
    value: "positive",
  },
  "spontaneity": {
    name: "spontaneity",
    group: "soul",
    value: "positive",
  },
  "spirituality": {
    name: "spirituality",
    group: "soul",
    value: "positive",
  },
  "surrealism": {
    name: "surrealism",
    group: "soul",
    value: "positive",
  },
  "tragicomedy": {
    name: "tragicomedy",
    group: "soul",
    value: "mixed",
  },
  "triumph": {
    name: "triumph",
    group: "spine",
    value: "positive",
  },
  "turmoil": {
    name: "turmoil",
    group: "mind",
    value: "negative",
  },
  "violence": {
    name: "violence",
    group: "body",
    value: "negative",
  },
  "vulnerability": {
    name: "vulnerability",
    group: "eyes",
    value: "negative",
  },
};

export const GROUP_TO_SENTIMENTS = Object.values(SENTIMENT_VALUES).reduce(
  (acc, sentiment) => {
    if (!acc[sentiment.group]) {
      acc[sentiment.group] = [];
    }
    acc[sentiment.group].push(sentiment.name);
    return acc;
  },
  {} as Record<string, string[]>
);


export const SENTIMENT_TO_GROUP = Object.values(SENTIMENT_VALUES).reduce(
  (acc, sentiment) => {
    acc[sentiment.name] = sentiment.group;
    return acc;
  },
  {} as Record<string, string>
);

export const VALID_SENTIMENTS = Object.keys(SENTIMENT_VALUES);
export const VALID_SENTIMENTS_SET = new Set(VALID_SENTIMENTS);

export const getSentimentValue = (sentiment: string) => {
  return SENTIMENT_VALUES[sentiment].value;
}
