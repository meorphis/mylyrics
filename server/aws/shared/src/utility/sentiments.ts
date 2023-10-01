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
  "flirtatiousness": {
    name: "flirtatiousness",
    group: "skin",
    value: "positive",
  },
  "frustration": {
    name: "frustration",
    group: "gut",
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
  "nostalgia": {
    name: "nostalgia",
    group: "eyes",
    value: "mixed",
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
    group: "gut",
    value: "negative",
  },
};

// export const nounToAdjective = (noun: string) => {
//   switch (noun) {
//   case "affection":
//     return "affectionate";
//   case "alienation":
//     return "alienated";
//   case "anger":
//     return "angry";
//   case "appreciation":
//     return "appreciative";
//   case "betrayal":
//     return "betrayed";
//   case "celebration":
//     return "celebratory";
//   case "chaos":
//     return "chaotic";
//   case "desperation": 
//     return "desperate";
//   case "determination":
//     return "determined";
//   case "disgust":
//     return "disgusted";
//   case "disillusionment":
//     return "disillusioned";
//   case "dreams":
//     return "dreamy";
//   case "empowerment":
//     return "empowered";
//   case "energy":
//     return "energetic";
//   case "enigma":
//     return "enigmatic";
//   case "euphoria":
//     return "euphoric";
//   case "excitement":
//     return "excited";
//   case "fear":
//     return "fearful";
//   case "flirtatiousness":
//     return "flirtatious";
//   case "frustration":
//     return "frustrated";
//   case "heartbreak":
//     return "heartbroken";
//   case "hope":
//     return "hopeful";
//   case "intimacy":
//     return "intimate";
//   case "introspection":
//     return "introspective";
//   case "joy":
//     return "joyful";
//   case "liberation":
//     return "liberated";
//   case "loneliness":
//     return "lonely";
//   case "loyalty":
//     return "loyal";
//   case "lust":
//     return "lustful";
//   case "melancholy":
//     return "melancholic";
//   case "nostalgia":
//     return "nostalgic";
//   case "obsession":
//     return "obsessive";
//   case "optimism":
//     return "optimistic";
//   case "passion":
//     return "passionate";
//   case "peace":
//     return "peaceful";
//   case "philosophy":
//     return "philosophical";
//   case "play":
//     return "playful";
//   case "provocation":
//     return "provocative";
//   case "rebellion":
//     return "rebellious";
//   case "recklessness":
//     return "reckless";
//   case "regret":
//     return "regretful";
//   case "resilience":
//     return "resilient";
//   case "romance":
//     return "romantic";
//   case "seduction":
//     return "seductive";
//   case "sensuality":
//     return "sensual";
//   case "spontaneity":
//     return "carefree";
//   case "spirituality":
//     return "spiritual";
//   case "surrealism":
//     return "surreal";
//   case "tragicomedy":
//     return "conflicted";
//   case "triumph":
//     return "triumphant";
//   case "turmoil":
//     return "tumultuous";
//   case "violence":
//     return "violent";
//   case "vulnerability":
//     return "vulnerable";
//   default:
//     return noun;
//   }
// }

// export const adjectiveBackToNoun = (adjective: string) => {
//   switch (adjective) {
//   case "affectionate":
//     return "affection";
//   case "alienated":
//     return "alienation";
//   case "angry":
//     return "anger";
//   case "appreciative":
//     return "appreciation";
//   case "betrayed":
//     return "betrayal";
//   case "celebratory":
//     return "celebration";
//   case "chaotic":
//     return "chaos";
//   case "desperate":
//     return "desperation";
//   case "determined":
//     return "determination";
//   case "disgusted":
//     return "disgust";
//   case "disillusioned":
//     return "disillusionment";
//   case "dreamy":
//     return "dreams";
//   case "empowered":
//     return "empowerment";
//   case "energetic":
//     return "energy";
//   case "enigmatic":
//     return "enigma";
//   case "euphoric":
//     return "euphoria";
//   case "excited":
//     return "excitement";
//   case "fearful":
//     return "fear";
//   case "flirtatious":
//     return "flirtatiousness";
//   case "frustrated":
//     return "frustration";
//   case "heartbroken":
//     return "heartbreak";
//   case "hopeful":
//     return "hope";
//   case "intimate":
//     return "intimacy";
//   case "introspective":
//     return "introspection";
//   case "joyful":
//     return "joy";
//   case "liberated":
//     return "liberation";
//   case "lonely":
//     return "loneliness";
//   case "loyal":
//     return "loyalty";
//   case "lustful":
//     return "lust";
//   case "melancholic":
//     return "melancholy";
//   case "nostalgic":
//     return "nostalgia";
//   case "obsessive":
//     return "obsession";
//   case "optimistic":
//     return "optimism";
//   case "passionate":
//     return "passion";
//   case "peaceful":
//     return "peace";
//   case "philosophical":
//     return "philosophy";
//   case "playful":
//     return "play";
//   case "provocative":
//     return "provocation";
//   case "rebellious":
//     return "rebellion";
//   case "reckless":
//     return "recklessness";
//   case "regretful":
//     return "regret";
//   case "resilient":
//     return "resilience";
//   case "romantic":
//     return "romance";
//   case "seductive":
//     return "seduction";
//   case "sensual":
//     return "sensuality";
//   case "carefree":
//     return "spontaneity";
//   case "spiritual":
//     return "spirituality";
//   case "surreal":
//     return "surrealism";
//   case "conflicted":
//     return "tragicomedy";
//   case "triumphant":
//     return "triumph";
//   case "tumultuous":
//     return "turmoil";
//   case "violent":
//     return "violence";
//   case "vulnerable":
//     return "vulnerability";
//   default:
//     return adjective;
//   }
// }

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
