import { FinalColor } from "extract-colors/lib/types/Color";

type LabeledPassageMetadata = {
    numLines: number;
    numCharsPerLine: number[];
    // since our UI will have to wrap text, an effective line can't be more than 35 characters
    numEffectiveLines: number;
}

export type LabelingMetadata = {
    labeledBy: "gpt-4o-mini" | "anthropic.claude-3-haiku-20240307-v1:0",
}

// a passage of lyrics that has been labeled with sentiments
export type LabeledPassage = {
    lyrics: string;
    sentiments: string[];
    metadata: LabeledPassageMetadata;
    isFullSong?: boolean;
}

// a passage of lyrics that has been labeled with sentiments and vectorized
export type VectorizedAndLabeledPassage = {
    lyrics: string;
    lyricsVector: number[];
    sentiments: string[];
    metadata: LabeledPassageMetadata
    isFullSong?: boolean;
}

// a song that has not yet been fully enriched with metadata from spotify
export type SimplifiedSong = {
    id: string,
    name: string,
    popularity: number,
    spotifyId: string,
    isExplicit: boolean,
    isrc: string | undefined,
    artists: SimplifiedArtist[],
    primaryArtist: SimplifiedArtist,
    album: {
        spotifyId: string,
    }
}

export type SongListen = {
    song: SimplifiedSong,
    metadata: {
        playedAt: number,
        playedFrom: string,
    }
}

// a song that has been fully enriched with metadata from spotify
export type Song = {
    id: string,
    name: string,
    popularity: number,
    spotifyId: string,
    isExplicit: boolean,
    isrc: string | undefined,
    artists: SimplifiedArtist[],
    primaryArtist: Artist,
    album: AlbumWithoutColors,
}

export type SimplifiedArtist = {
    id: string,
    name: string,
    spotifyId: string,
}

export type Artist = {
    id: string,
    name: string,
    spotifyId: string,
    popularity: number,
}

type AlbumImageWithoutColors = {
    url: string,
    height?: number,
    width?: number,
}

type AlbumImageWithColors = AlbumImageWithoutColors & {
    colors: FinalColor[],
}

type AlbumWithoutColors = {
    name: string,
    spotifyId: string,
    genres: string[],
    image: AlbumImageWithoutColors,
    releaseDate: string,
};

type AlbumWithColors = AlbumWithoutColors & {
    image: AlbumImageWithColors,
}

export type IndexedSong = Song & {
    lyrics: string,
    album: AlbumWithColors,
}

export type RecommendationType = 
    "artist" | "top" | "sentiment" | "lookup" | "semantic_search";

export type BundleInfo = {
    type: "sentiment",
    key: string,
    sentiment: string,
    group: string;
    value: "positive" | "mixed" | "negative",
} | {
    type: "top",
    key: string,
    group: "essentials"
} | {
    type: "artist",
    key: string,
    group: "featured",
    artist: {
        name: string,
        emoji: string,
    }
}

export type Recommendation = {
    lyrics: string,
    analysis?: string,
    song: {
        id: string,
        album: {
            name: string,
            image: {
                url: string,
                colors: FinalColor[] | null;
            },
        },
        artists: {
            id: string,
            name: string,
        }[],
        name: string,
        lyrics: string,
    },
    bundleInfos: BundleInfo[],
    score: number,
    type: RecommendationType,
}
