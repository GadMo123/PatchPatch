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
  ['c', 'd', 'h', 's'].includes(suit);

export const isValidRank = (rank: string): rank is Rank =>
  ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'].includes(
    rank
  );

// export function fromString(card: string): Card {
//   const rank = card.slice(0, -1) as Rank;
//   const suit = card.slice(-1) as Suit;
//   return { rank, suit };
// }
