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

export interface Card {
  rank: Rank;
  suit: Suit;
}

// Optional helper functions
export const isValidSuit = (suit: string): suit is Suit =>
  ['c', 'd', 'h', 's'].includes(suit);

export const isValidRank = (rank: string): rank is Rank =>
  ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'].includes(
    rank
  );
