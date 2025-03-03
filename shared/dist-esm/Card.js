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
    equals(other) {
        return this._rank === other._rank && this._suit === other._suit;
    }
}
export const isValidSuit = (suit) => SUITS.includes(suit);
export const isValidRank = (rank) => RANKS.includes(rank);
export const parseCard = (item) => {
    var _a, _b;
    if (typeof item === "object" && item !== null) {
        const rank = (_a = item.rank) !== null && _a !== void 0 ? _a : item._rank;
        const suit = (_b = item.suit) !== null && _b !== void 0 ? _b : item._suit;
        if (typeof rank === "string" &&
            typeof suit === "string" &&
            isValidRank(rank) &&
            isValidSuit(suit)) {
            return new Card(rank, suit);
        }
    }
    return null;
};
