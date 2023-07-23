import SentimentEnumType from './sentiments';

type TagType = {
  type: 'sentiment';
  sentiment: SentimentEnumType;
};

export default TagType;
