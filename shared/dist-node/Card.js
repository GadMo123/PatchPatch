"use strict";
// src/game/types/CardTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCard = exports.isValidRank = exports.isValidSuit = exports.Card = exports.RANKS = exports.SUITS = void 0;
exports.SUITS = ["c", "d", "h", "s"];
exports.RANKS = [
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
class Card {
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
exports.Card = Card;
const isValidSuit = (suit) => exports.SUITS.includes(suit);
exports.isValidSuit = isValidSuit;
const isValidRank = (rank) => exports.RANKS.includes(rank);
exports.isValidRank = isValidRank;
const parseCard = (item) => {
    var _a, _b;
    if (typeof item === "object" && item !== null) {
        const rank = (_a = item.rank) !== null && _a !== void 0 ? _a : item._rank;
        const suit = (_b = item.suit) !== null && _b !== void 0 ? _b : item._suit;
        if (typeof rank === "string" &&
            typeof suit === "string" &&
            (0, exports.isValidRank)(rank) &&
            (0, exports.isValidSuit)(suit)) {
            return new Card(rank, suit);
        }
    }
    return null;
};
exports.parseCard = parseCard;
