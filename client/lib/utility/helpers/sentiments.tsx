import {BundleInfo} from '../../types/bundle';

export const getBundleDisplayName = (info: BundleInfo) => {
  switch (info.type) {
    case 'artist':
      return `featured: ${info.artist.name}`;
    case 'sentiment':
      return info.sentiment;
    case 'top':
      return 'heavy rotation';
    case 'user_made':
      return info.title.length > 15
        ? `${info.title.slice(0, 15)}...`
        : info.title;
    case 'singleton':
      return null;
  }
};

export const getBundleEmoji = (info: BundleInfo) => {
  switch (info.type) {
    case 'artist':
      return info.artist.emoji;
    case 'sentiment':
      return sentimentToEmojiMap[info.sentiment];
    case 'top':
      return '🥇';
    case 'user_made':
      return null;
    case 'singleton':
      return null;
  }
};

const sentimentToEmojiMap: Record<string, string> = {
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
  likes: '❤️',
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
