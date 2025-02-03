export type Suit = "c" | "d" | "h" | "s";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";
export declare const SUITS: Suit[];
export declare const RANKS: Rank[];
export declare class Card {
    private _rank;
    private _suit;
    constructor(_rank: Rank, _suit: Suit);
    get rank(): Rank;
    get suit(): Suit;
}
export declare const isValidSuit: (suit: string) => suit is Suit;
export declare const isValidRank: (rank: string) => rank is Rank;
//# sourceMappingURL=Card.d.ts.map