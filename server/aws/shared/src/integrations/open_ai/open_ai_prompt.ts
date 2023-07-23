/* eslint-disable max-len */
export const VALID_SENTIMENTS = [
  "affectionate", "alienated", "angry", "appreciative", "betrayed", "bittersweet",
  "carefree", "celebratory", "chaotic", "conflicted", "desperate",
  "determined", "disillusioned", "dreamy", "empowered", "energetic",
  "enigmatic", "euphoric", "excited", "fearful", "flirtatious",
  "frustrated", "haunting", "heartbroken", "hopeful", "intimate",
  "introspective", "joyful", "liberating", "lonely", "loyal", "lustful",
  "melancholic", "nostalgic", "obsessive", "optimistic", "passionate",
  "peaceful", "philosophical", "playful", "provocative", "rebellious",
  "reckless", "regretful", "resilient", "romantic", "seductive", "sensual",
  "spiritual", "surreal", "triumphant", "violent", "vulnerable"
]

// we refer to sentiments as "floopters" in our prompt in order to steer the LLM away from
// its preconceived notions about what a sentiment is and instead select from our curated list
export const SYSTEM_MESSAGE = `The following adjectives are considered "floopters": ${VALID_SENTIMENTS.join(", ")}.

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
- If a floopter is not in the list provided above, it is not valid and should not be included in your response.`;

export const USER_EXAMPLE_MESSAGE = `[Intro]
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

export const ASSISTANT_EXAMPLE_MESSAGE = "{\"floopters\":[\"passionate\",\"energetic\",\"lustful\"],\"passages\":[{\"lyrics\":\"I feel the rush\\nAddicted to your touch\\nOh, I feel the rush\\nIt's so good, it's so good\",\"sentiments\":[\"passionate\",\"energetic\",\"euphoric\"]},{\"lyrics\":\"Big communication, tell me what you want\\nTranslate your vibration, let your body talk to me\\nBaby love, if you wanna show me what\\nYou've been schemin' up, if you wanna (Let go)\",\"sentiments\":[\"flirtatious\",\"seductive\"]},{\"lyrics\":\"You got my heartbeat racin'\\nMy body blazin'\",\"sentiments\":[\"excited\",\"lustful\"]},{\"lyrics\":\"So good when we slow gravity, so good\\nIt's so good, it's so good\\nBreathe one, two, three, take all of me, so good\\nIt's so good, it's so good\",\"sentiments\":[\"passionate\",\"intimate\"]},{\"lyrics\":\"Pass your boy the heatwave, recreate the sun\\nTake me to the feeling, boy, you know the one\\nKiss it when you're done, man, this shit is so much fun\\nPocket rocket gun\",\"sentiments\":[\"energetic\",\"playful\",\"lustful\"]}]}"
