export type TopSentimentData = {
  sentiment: string;
  percentage: number;
  artists: {
    name: string;
  }[];
};

export type TopSentimentsInterval = 'last-day' | 'last-week' | 'all-time';
