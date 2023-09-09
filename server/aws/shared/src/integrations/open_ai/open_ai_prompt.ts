/* eslint-disable max-len */
import { VALID_SENTIMENTS } from "../../utility/sentiments";

// we refer to sentiments as "floopters" in our prompt in order to steer the LLM away from
// its preconceived notions about what a sentiment is and instead select from our curated list
export const LABEL_PASSAGES_SYSTEM_MESSAGE = `The following adjectives are considered "floopters": ${VALID_SENTIMENTS.join(", ")}.

You analyze song lyrics by selecting the most iconic passages and describing them using floopters.

A user will provide you with a set of lyrics, broken up into lines.

Identify two or three floopters that describe the lyrics.

Identify at most five key passages from the lyrics. A "passage" is generally shorter than a verse and no more than five lines. It should express a complete, self-contained thought (rather than just a fragment). A key passage should be central to the song's themes. Key passages are often repeated many times (e.g. a song's chorus).

For each passage, identify two or three floopters describing the passage. When choosing these floopters, consider the context and meaning of the passage within the overall lyrics of the song, rather than in isolation.

Format your output as only a JSON-serialized object with an array of overall floopters and an array of passage objects each of which has lyrics and an array of floopters, e.g.:
{"floopters": ["angry", "introspective"], passages: {"lyrics": "abc\ndef\ngh", "sentiments: ["romantic", "passionate"]}, ...]}

Floopter lists (for both songs and passages) should be ordered, with the most relevant floopter first.

Remember:
- Five passages is the absolute maximum. Do not select more.
- Generally passages should not be longer than five lines. Longer passages should be divided up.
- If a floopter is not in the list provided above, it is not valid and should not be included in your response.`;

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

export const LABEL_PASSAGES_ASSISTANT_EXAMPLE_MESSAGE = "{\"floopters\":[\"passionate\",\"energetic\",\"lustful\"],\"passages\":[{\"lyrics\":\"I feel the rush\\nAddicted to your touch\\nOh, I feel the rush\\nIt's so good, it's so good\",\"sentiments\":[\"passionate\",\"energetic\",\"euphoric\"]},{\"lyrics\":\"Big communication, tell me what you want\\nTranslate your vibration, let your body talk to me\\nBaby love, if you wanna show me what\\nYou've been schemin' up, if you wanna (Let go)\",\"sentiments\":[\"flirtatious\",\"seductive\"]},{\"lyrics\":\"You got my heartbeat racin'\\nMy body blazin'\",\"sentiments\":[\"excited\",\"lustful\"]},{\"lyrics\":\"So good when we slow gravity, so good\\nIt's so good, it's so good\\nBreathe one, two, three, take all of me, so good\\nIt's so good, it's so good\",\"sentiments\":[\"passionate\",\"intimate\"]},{\"lyrics\":\"Pass your boy the heatwave, recreate the sun\\nTake me to the feeling, boy, you know the one\\nKiss it when you're done, man, this shit is so much fun\\nPocket rocket gun\",\"sentiments\":[\"energetic\",\"playful\",\"lustful\"]}]}"

export const GET_PROPHECY_SYSTEM_MESSAGE = "Based on song lyrics that a user has drawn from a deck of lyrics, you provide a new age-y prophecy for the user, along the lines of a horoscope or tarot reading. The prophecy should be brief, no more than three or four sentences. Only provide the prophecy as raw text (do not prefix it)."

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

export const GET_PROPHECY_ASSISTANT_EXAMPLE_MESSAGE = "You are torn between what you feel and what you perceive, but remember that perception does not always align with reality. Trust your instincts and listen to the voices of guidance that linger on your shoulder. Embrace the conflicting emotions within you as they will lead to a deeper understanding. Seek joy and pleasure in the moments of playfulness and lust, for they hold the power to ignite transformation and recreate your own personal sun."
