// src/game/types/CardTypes.ts

export type Suit = 'c' | 'd' | 'h' | 's';
export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'T'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export const SUITS: Suit[] = ['c', 'd', 'h', 's'];
export const RANKS: Rank[] = [
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

export class Card {
  constructor(
    private _rank: Rank,
    private _suit: Suit
  ) {}

  public get rank(): Rank {
    return this._rank;
  }

  public get suit(): Suit {
    return this._suit;
  }
}

export const isValidSuit = (suit: string): suit is Suit =>
  SUITS.includes(suit as Suit);

export const isValidRank = (rank: string): rank is Rank =>
  RANKS.includes(rank as Rank);
