// src/game/types/CardTypes.ts

export type Suit = "c" | "d" | "h" | "s";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K"
  | "A";

export const SUITS: Suit[] = ["c", "d", "h", "s"];
export const RANKS: Rank[] = [
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

export class Card {
  constructor(private _rank: Rank, private _suit: Suit) {}

  public get rank(): Rank {
    return this._rank;
  }

  public get suit(): Suit {
    return this._suit;
  }

  public equals(other: Card): boolean {
    return this._rank === other._rank && this._suit === other._suit;
  }
}

export const isValidSuit = (suit: string): suit is Suit =>
  SUITS.includes(suit as Suit);

export const isValidRank = (rank: string): rank is Rank =>
  RANKS.includes(rank as Rank);

export const parseCard = (item: unknown): Card | null => {
  if (typeof item === "object" && item !== null) {
    const rank = (item as any).rank ?? (item as any)._rank;
    const suit = (item as any).suit ?? (item as any)._suit;

    if (
      typeof rank === "string" &&
      typeof suit === "string" &&
      isValidRank(rank) &&
      isValidSuit(suit)
    ) {
      return new Card(rank, suit);
    }
  }
  return null;
};
