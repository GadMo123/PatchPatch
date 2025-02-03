"use strict";
// src/game/utils/Deck.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deck = void 0;
const Card_1 = require("../../../../shared/src/Card");
class Deck {
    constructor() {
        this._deck = [];
        this.initializeDeck();
        this.shuffleDeck();
    }
    initializeDeck() {
        for (const suit of Card_1.SUITS) {
            for (const rank of Card_1.RANKS) {
                this._deck.push(new Card_1.Card(rank, suit));
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