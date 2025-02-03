"use strict";
// src/game/types/CardTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidRank = exports.isValidSuit = exports.Card = exports.RANKS = exports.SUITS = void 0;
exports.SUITS = ['c', 'd', 'h', 's'];
exports.RANKS = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'T',
    'J',
    'Q',
    'K',
    'A',
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
}
exports.Card = Card;
const isValidSuit = (suit) => exports.SUITS.includes(suit);
exports.isValidSuit = isValidSuit;
const isValidRank = (rank) => exports.RANKS.includes(rank);
exports.isValidRank = isValidRank;
//# sourceMappingURL=Card.js.map