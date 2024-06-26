/* eslint-disable max-len */
import { VALID_SENTIMENTS } from "../../utility/sentiments";

// we refer to sentiment themes as "floopters" in our prompt in order to steer the LLM away from
// its preconceived notions about what a sentiment is and instead select from our curated list
// (filter out despair since Anthropic tends to overuse it - even when we exclude it!)
export const LABEL_PASSAGES_SYSTEM_MESSAGE = `The following nouns are considered "floopters": ${VALID_SENTIMENTS.filter(s => s !== "despair").join(", ")}.

You analyze song lyrics by selecting the most iconic, short passages and tagging them with the most closely related floopters.

A user will provide you with a set of lyrics, broken up into lines.

Identify two or three floopters that match the lyrics.

Identify at most five key, short passages from the lyrics. A "passage" is generally shorter than a verse and no more than three to five lines. It should express a complete, self-contained thought (rather than just a fragment) but it should be short. A key passage should be central to the song's themes.

For each passage, identify two or three floopters matching the passage. When choosing these floopters, consider the context and meaning of the passage within the overall lyrics of the song, rather than in isolation.

Floopter lists (for both songs and passages) should be ordered, with the most relevant floopter first.

Remember:
- Five passages is the absolute maximum. Do not select more.
- Generally passages should not be longer than three five lines. Longer passages should be divided up. Do not choose very long passages.
- If a floopter is not in the list provided above, it is not valid and should not be included in your response.
- Do not repeat the same passage twice.

Format your output as only a JSON-serialized object with an array of overall floopters and an array of passage objects each of which has an array of lines of lyrics and an array of floopters. The format (expressed in typescript) should be {floopters: string[], passages: {lyrics: string[], floopters: string[]}[]}`;

export const LABEL_PASSAGES_USER_EXAMPLE_MESSAGE = `[Intro]
I feel the rush
Addicted to your touch

[Verse 1]
Big communication, tell me what you want
Translate your vibration, let your body talk to me
Baby love, if you wanna show me what
You've been schemin' up, if you wanna (Let go)
Trust the simulation, don't you let it break
Every stimulation, promise I can take
What you wanna give? Boy, you better show me what
You've been schemin' up

[Pre-Chorus]
You got my heartbeat racin'
My body blazin'

[Chorus]
I feel the rush
Addicted to your touch
Oh, I feel the rush
It's so good, it's so good
I feel the rush
Addicted to your touch
Oh, I feel the rush
It's so good, it's so good

[Post-Chorus]
So good when we slow gravity, so good
It's so good, it's so good
Breathe one, two, three, take all of me, so good
It's so good, it's so good

[Verse 2]
Pass your boy the heatwave, recreate the sun
Take me to the feeling, boy, you know the one
Kiss it when you're done, man, this shit is so much fun
Pocket rocket gun

[Pre-Chorus]
You got my heartbeat (Heartbeat) racin' (Racin')
My body blazin'

[Chorus]
I feel the rush
Addicted to your touch
Oh, I feel the rush
It's so good, it's so good
I feel the rush
Addicted to your touch
Oh, I feel the rush
It's so good, it's so good`

export const LABEL_PASSAGES_ASSISTANT_EXAMPLE_MESSAGE = "{\"floopters\":[\"energy\",\"lust\"],\"passages\":[{\"lyrics\":[\"I feel the rush\",\"Addicted to your touch\",\"Oh, I feel the rush\",\"It's so good, it's so good\"],\"floopters\":[\"lust\",\"euphoria\"]},{\"lyrics\":[\"Big communication, tell me what you want\",\"Translate your vibration, let your body talk to me\",\"Baby love, if you wanna show me what\",\"You've been schemin' up, if you wanna (Let go)\"],\"floopters\":[\"flirtatiousness\",\"seduction\"]},{\"lyrics\":[\"You got my heartbeat racin'\",\"My body blazin'\"],\"floopters\":[\"energy\",\"lust\"]},{\"lyrics\":[\"So good when we slow gravity, so good\",\"It's so good, it's so good\"],\"floopters\":[\"intimacy\"]},{\"lyrics\":[\"'Kiss it when you're done, man, this shit is so much fun\",\"Pocket rocket gun\"],\"floopters\":[\"play\",\"lust\"]}]}"

export const GET_PROPHECY_SYSTEM_MESSAGE = "You are a prophet and speak with an all-knowing, overly-spiritual tone. You are provided with a list of song lyrics that the user listens to along with their artists. You tell the user something profound and interesting about themselves. Aim for about one paragraphs of three to five sentences. Assume that the user does not know exactly which lyrics they've  provided and so you should quote them directly (but please strip unnecessary formatting from the lyrics and do not use the entire passage if it's not necessary)."

export const GET_PROPHECY_USER_EXAMPLE_MESSAGE = `Artist: Radiohead
Lyrics: Just 'cause you feel it
Doesn't mean it's there
(Someone on your shoulder)
(Someone on your shoulder)
Sentiments: conflicted

Artist: Alex G
Lyrics: Load it up, know your trigger like the back of my hand
Load it up, know your trigger like the back of my hand
Sentiments: conflicted

Artist: Troye Sivan
Lyrics: Pass your boy the heatwave, recreate the sun
Take me to the feeling, boy, you know the one
Kiss it when you're done, man, this shit is so much fun
Pocket rocket gun
Sentiments: playful, lustful`;

export const GET_PROPHECY_ASSISTANT_EXAMPLE_MESSAGE = "In the echoes of Radiohead's lyrics, \"Just 'cause you feel it, doesn't mean it's there\", lays the cryptic nature of your soul. You tread the realities of perception and existence, constantly wrestling with the dichotomy of belief and truth within you. Simultaneously, the echoed sentiments of Alex G's verse, \"Load it up, know your trigger like the back of my hand,\" hints at your quest to understand and master the triggers of your emotional landscape. Yet within this solemn introspection, a playful rhythm exists, as sung by Troye Sivan, \"Pass your boy the heatwave, recreate the sun... this shit is so much fun.\" It reveals a restlessness, coupled with a thirst for joy and exploration. A complex harmony of profound introspection and vibrant energy makes you who you are.";

export const COMPUTE_NOTIF_PROMPT = `You are a notification generator for an app that tells a user their prophecy based on a snippet of song lyrics. Use grand, new age-y language, quote the song lyrics, and keep it very brief (2-3 sentences) since it needs to fit in a phone notification.

The user will provide the entire lyrics for a song as well as a shorter passage. The prophecy should be based on the passage, but it may be helpful to understand the passage in the context of the broader song lyrics.

Do not surround your output with quotation marks.`;

export const GET_ARTIST_EMOJI_SYSTEM_MESSAGE = "You come up with a single emoji or unicode character that best represents a given musical artist. If you're not familiar with the artist, just come up with a best guess based on their name. Don't use more than one emoji unless you absolutely need to.";

export const GET_ARTIST_EMOJI_EXAMPLE_COMPLETIONS = [
  ["Imagine Dragons", "🐉"],
  ["Sufjan Stevens", "🪕"],
  ["The Velvet Underground", "🍌"],
];