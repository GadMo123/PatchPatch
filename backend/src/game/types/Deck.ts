// src/game/utils/Deck.ts

import { Card, RANKS, SUITS } from "shared";

export class Deck {
  private _deck: Card[] = [];

  constructor() {
    this.initializeDeck();
    this.shuffleDeck();
  }

  private initializeDeck() {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this._deck.push(new Card(rank, suit));
      }
    }
  }

  private shuffleDeck() {
    this._deck = this._deck.sort(() => Math.random() - 0.5);
  }

  getPlayerCards(): Card[] {
    return this._deck.splice(0, 12);
  }

  getFlops(): Card[][] {
    return [
      this._deck.splice(0, 3),
      this._deck.splice(0, 3),
      this._deck.splice(0, 3),
    ];
  }

  getTurns(): Card[] {
    return this._deck.splice(0, 3);
  }

  getRivers(): Card[] {
    return this._deck.splice(0, 3);
  }
}
