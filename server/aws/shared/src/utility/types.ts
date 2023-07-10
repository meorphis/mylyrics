export type LabeledPassage = {
    lyrics: string;
    sentiments: string[];
}
  
export type VectorizedAndLabeledPassage = {
    lyrics: string;
    lyricsVector: number[];
    sentiments: string[];
}

export type Song ={
    songId: string;
    artistId: string;
    songName: string;
    artistName: string;
}