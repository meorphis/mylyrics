type LabeledPassageMetadata = {
    numLines: number;
    numCharsPerLine: number[];
    // since our UI will have to wrap text, an effective line can't be more than 35 characters
    numEffectiveLines: number;
}

export type LabelingMetadata = {
    labeledBy: "gpt-3.5-turbo",
}

// a passage of lyrics that has been labeled with sentiments
export type LabeledPassage = {
    lyrics: string;
    sentiments: string[];
    metadata: LabeledPassageMetadata
}

// a passage of lyrics that has been labeled with sentiments and vectorized
export type VectorizedAndLabeledPassage = {
    lyrics: string;
    lyricsVector: number[];
    sentiments: string[];
    metadata: LabeledPassageMetadata
}

// a song that has not yet been fully enriched with metadata from spotify
export type SimplifiedSong = {
    id: string,
    name: string,
    popularity: number,
    spotifyId: string,
    isExplicit: boolean,
    isrc: string | undefined,
    artists: {
        id: string,
        name: string,
        spotifyId: string,
    }[],
    primaryArtist: {
        id: string,
        name: string,
        spotifyId: string,
    },
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
    features: {
        acousticness: number,
        danceability: number,
        energy: number,
        instrumentalness: number,
        liveness: number,
        loudness: number,
        speechiness: number,
        tempo: number,
        valence: number,
    },
    artists: {
        id: string,
        name: string,
        spotifyId: string,
    }[],
    primaryArtist: {
        id: string,
        name: string,
        spotifyId: string,
        popularity: number,
    },
    album: {
        name: string,
        spotifyId: string,
        genres: string[],
        image: {
            url: string,
            height?: number,
            width?: number,
        },
        releaseDate: string,
    },
}

export type SongWithLyrics = Song & {
    lyrics: string,
}

export type Recommendation = {
    lyrics: string,
    song: {
        id: string,
        album: {
            name: string,
            image: string,
        },
        artists: {
            id: string,
            name: string,
        }[],
        name: string,
        lyrics: string,
    },
    tags: {
        type: "sentiment",
        sentiment: string,
    }[]
}
