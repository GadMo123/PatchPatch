"use strict";
// src/game/utils/Deck.ts - Deck of cards representation
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deck = void 0;
const shared_1 = require("shared");
class Deck {
    constructor() {
        this._deck = [];
        this.initializeDeck();
        this.shuffleDeck();
    }
    initializeDeck() {
        for (const suit of shared_1.SUITS) {
            for (const rank of shared_1.RANKS) {
                this._deck.push(new shared_1.Card(rank, suit));
            }
        }
    }
    shuffleDeck() {
        this._deck = this._deck.sort(() => Math.random() - 0.5);
    }
    getPlayerCards() {
        return this._deck.splice(0, 12);
    }
    getFlops() {
        return [
            this._deck.splice(0, 3),
            this._deck.splice(0, 3),
            this._deck.splice(0, 3),
        ];
    }
    getTurns() {
        return this._deck.splice(0, 3);
    }
    getRivers() {
        return this._deck.splice(0, 3);
    }
}
exports.Deck = Deck;
//# sourceMappingURL=Deck.js.map