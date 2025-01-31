// src/game/utils/Deck.ts

import { Card, RANKS, SUITS } from './Card';

export class Deck {
  private deck: Card[] = [];

  constructor() {
    this.initializeDeck();
    this.shuffleDeck();
  }

  private initializeDeck() {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.deck.push(new Card(rank, suit));
      }
    }
  }

  private shuffleDeck() {
    this.deck = this.deck.sort(() => Math.random() - 0.5);
  }

  getPlayerCards(): Card[] {
    return this.deck.splice(0, 12);
  }

  getFlops(): Card[][] {
    return [
      this.deck.splice(0, 3),
      this.deck.splice(0, 3),
      this.deck.splice(0, 3),
    ];
  }

  getTurns(): Card[] {
    return this.deck.splice(0, 3);
  }

  getRivers(): Card[] {
    return this.deck.splice(0, 3);
  }
}
