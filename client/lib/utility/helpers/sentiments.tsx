import {BundleInfo} from '../../types/bundle';

export const getBundleDisplayName = (info: BundleInfo) => {
  switch (info.type) {
    case 'artist':
      return `${info.artist.name}`;
    case 'sentiment':
      return info.sentiment;
    case 'top':
      return 'heavy rotation';
    case 'likes':
      return 'recent likes';
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
      return info.artist.emoji || '🎵';
    case 'sentiment':
      return sentimentToEmojiMap[info.sentiment];
    case 'top':
      return '🎧';
    case 'likes':
      return '❤️';
    case 'user_made':
      return null;
    case 'singleton':
      return null;
  }
};

export const doesEmojiLookGoodAsASilhouette = (emoji: string) => {
  return [
    '🙏', '🔪', '🎉', '🖕', '💪',
    '🤷‍♀️', '🧩', '✨', '💔', '🔍',
    '🦋', '🔥', '🕊️', '🌱', '💕',
    '🌹', '🦄', '🏆', '🔫'
  ].includes(emoji);
}

const sentimentToEmojiMap: Record<string, string> = {
  affection: '🥰',
  alienation: '👽',
  anger: '😡',
  anxiety: '😰',
  appreciation: '🙏',
  betrayal: '🔪',
  celebration: '🎉',
  chaos: '😵‍💫',
  confusion: '🤔',
  curiosity: '🤓',
  defiance: '🖕',
  despair: '😭',
  desperation: '😫',
  determination: '💪',
  disgust: '🤮',
  disillusionment: '🤷‍♀️',
  dreams: '🌈',
  empowerment: '👊',
  energy: '🤸‍♀️',
  enigma: '🧩',
  euphoria: '✨',
  excitement: '🤩',
  fear: '😱',
  flirting: '😉',
  friendship: '👯‍♀️',
  frustration: '😤',
  heartbreak: '💔',
  hope: '🤞',
  humor: '🪦',
  intimacy: '💏',
  introspection: '🔍',
  joy: '🥳',
  liberation: '🦋',
  loneliness: '🌘',
  longing: '🥺',
  love: '💖',
  loyalty: '🐶',
  lust: '🥵',
  melancholy: '😢',
  mystery: '🕵️‍♀️',
  nostalgia: '👵',
  obsession: '🤤',
  optimism: '🌞',
  passion: '🔥',
  peace: '🕊️',
  philosophy: '📚',
  play: '😄',
  provocation: '😏',
  rebellion: '🤘',
  recklessness: '🏎️',
  regret: '😔',
  resilience: '🌱',
  romance: '💕',
  seduction: '😈',
  sensuality: '🌹',
  spontaneity: '🎲',
  spirituality: '🧘‍♀️',
  surrealism: '🦄',
  tragicomedy: '🎭',
  triumph: '🏆',
  turmoil: '🌪️',
  violence: '🔫',
  vulnerability: '😳',
};
