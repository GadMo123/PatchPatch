// src/game/types/CardTypes.ts
export const SUITS = ["c", "d", "h", "s"];
export const RANKS = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "T",
    "J",
    "Q",
    "K",
    "A",
];
export class Card {
    constructor(_rank, _suit) {
        this._rank = _rank;
        this._suit = _suit;
    }
    get rank() {
        return this._rank;
    }
    get suit() {
        return this._suit;
    }
}
export const isValidSuit = (suit) => SUITS.includes(suit);
export const isValidRank = (rank) => RANKS.includes(rank);
