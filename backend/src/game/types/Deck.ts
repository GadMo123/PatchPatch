// src/game/utils/Deck.ts

import { Card, Rank, Suit } from './Card';

export class Deck {
  private deck: string[] = [];
  private suits: Suit[] = ['c', 'd', 'h', 's']; // Clubs, Diamonds, Hearts, Spades
  private ranks: Rank[] = [
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
  ]; // T for Ten

  constructor() {
    this.initializeDeck();
    this.shuffleDeck();
  }

  private initializeDeck() {
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        this.deck.push(`${rank}${suit}`);
      }
    }
  }

  private shuffleDeck() {
    this.deck = this.deck.sort(() => Math.random() - 0.5);
  }

  private convertToCardObject(card: string): Card {
    const rank = card.slice(0, -1) as Rank;
    const suit = card.slice(-1) as Suit;
    return { rank, suit };
  }

  getPlayerCards(): Card[] {
    return this.deck.splice(0, 12).map(this.convertToCardObject);
  }

  getFlops(): Card[][] {
    return [
      this.deck.splice(0, 3).map(this.convertToCardObject),
      this.deck.splice(0, 3).map(this.convertToCardObject),
      this.deck.splice(0, 3).map(this.convertToCardObject),
    ];
  }

  getTurns(): Card[] {
    return this.deck.splice(0, 3).map(this.convertToCardObject);
  }

  getRivers(): Card[] {
    return this.deck.splice(0, 3).map(this.convertToCardObject);
  }
}
