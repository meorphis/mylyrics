import SentimentEnumType from '../../types/sentiments';

export const allSentiments: SentimentEnumType[] = [
  'affectionate',
  'alienated',
  'angry',
  'appreciative',
  'betrayed',
  'bittersweet',
  'carefree',
  'celebratory',
  'chaotic',
  'conflicted',
  'desperate',
  'determined',
  'disillusioned',
  'dreamy',
  'empowered',
  'energetic',
  'enigmatic',
  'euphoric',
  'excited',
  'fearful',
  'flirtatious',
  'frustrated',
  'haunting',
  'heartbroken',
  'hopeful',
  'intimate',
  'introspective',
  'joyful',
  'liberating',
  'lonely',
  'loyal',
  'lustful',
  'melancholic',
  'nostalgic',
  'obsessive',
  'optimistic',
  'passionate',
  'peaceful',
  'philosophical',
  'playful',
  'provocative',
  'rebellious',
  'reckless',
  'regretful',
  'resilient',
  'romantic',
  'seductive',
  'sensual',
  'spiritual',
  'surreal',
  'triumphant',
  'violent',
  'vulnerable',
];

export const sentimentAdjectiveToNoun = (
  adjective: SentimentEnumType | null,
) => {
  switch (adjective) {
    case 'affectionate':
      return 'affection';
    case 'alienated':
      return 'alienation';
    case 'angry':
      return 'anger';
    case 'appreciative':
      return 'appreciation';
    case 'betrayed':
      return 'betrayal';
    case 'bittersweet':
      return 'bittersweetness';
    case 'carefree':
      return 'spontaneity';
    case 'celebratory':
      return 'celebration';
    case 'chaotic':
      return 'chaos';
    case 'conflicted':
      return 'conflict';
    case 'desperate':
      return 'desperation';
    case 'determined':
      return 'determination';
    case 'disillusioned':
      return 'disillusion';
    case 'dreamy':
      return 'dreaminess';
    case 'empowered':
      return 'empowerment';
    case 'energetic':
      return 'energy';
    case 'enigmatic':
      return 'enigma';
    case 'euphoric':
      return 'euphoria';
    case 'excited':
      return 'excitement';
    case 'fearful':
      return 'fear';
    case 'flirtatious':
      return 'flirtatiousness';
    case 'frustrated':
      return 'frustration';
    case 'haunting':
      return 'haunting';
    case 'heartbroken':
      return 'heartbreak';
    case 'hopeful':
      return 'hope';
    case 'intimate':
      return 'intimacy';
    case 'introspective':
      return 'introspection';
    case 'joyful':
      return 'joy';
    case 'liberating':
      return 'liberation';
    case 'lonely':
      return 'loneliness';
    case 'loyal':
      return 'loyalty';
    case 'lustful':
      return 'lust';
    case 'melancholic':
      return 'melancholy';
    case 'nostalgic':
      return 'nostalgia';
    case 'obsessive':
      return 'obsession';
    case 'optimistic':
      return 'optimism';
    case 'passionate':
      return 'passion';
    case 'peaceful':
      return 'peace';
    case 'philosophical':
      return 'philosophy';
    case 'playful':
      return 'playfulness';
    case 'provocative':
      return 'provocation';
    case 'rebellious':
      return 'rebellion';
    case 'reckless':
      return 'recklessness';
    case 'regretful':
      return 'regret';
    case 'resilient':
      return 'resilience';
    case 'romantic':
      return 'romance';
    case 'seductive':
      return 'seduction';
    case 'sensual':
      return 'sensuality';
    case 'spiritual':
      return 'spirituality';
    case 'surreal':
      return 'surreality';
    case 'triumphant':
      return 'triumph';
    case 'violent':
      return 'violence';
    case 'vulnerable':
      return 'vulnerability';
    default:
      return adjective;
  }
};

export const sentimentToEmojiMap: Record<SentimentEnumType, string> = {
  affectionate: '🥰',
  alienated: '👽',
  angry: '😡',
  appreciative: '🙏',
  betrayed: '🔪',
  bittersweet: '😔💛',
  carefree: '🤗',
  celebratory: '🎉',
  chaotic: '🤪',
  conflicted: '🤔',
  desperate: '😫',
  determined: '💪',
  disillusioned: '🤷‍♀️',
  dreamy: '🌈',
  empowered: '👊',
  energetic: '🤸‍♀️',
  enigmatic: '🧩',
  euphoric: '✨',
  excited: '🤩',
  fearful: '😱',
  flirtatious: '😉',
  frustrated: '😤',
  haunting: '👻',
  heartbroken: '💔',
  hopeful: '🤞',
  intimate: '💏',
  introspective: '🔍',
  joyful: '🥳',
  liberating: '🦋',
  lonely: '🌘',
  loyal: '🐶',
  lustful: '🥵',
  melancholic: '😢',
  nostalgic: '👵',
  obsessive: '🤤',
  optimistic: '🌞',
  passionate: '🔥',
  peaceful: '🕊️',
  philosophical: '📚',
  playful: '😄',
  provocative: '😏',
  rebellious: '🤘',
  reckless: '🏎️',
  regretful: '😔',
  resilient: '🌱',
  romantic: '💕',
  seductive: '😈',
  sensual: '🌹',
  spiritual: '🧘‍♀️',
  surreal: '🦄',
  triumphant: '🏆',
  violent: '🔫',
  vulnerable: '😳',
};
