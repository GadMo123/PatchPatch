import { Card } from "@patchpatch/shared";
import {
  flushes,
  otherRanks,
  products,
  uniqueRanks,
} from "server/Cactus-Kev's-Lookups";

const ranks: Map<string, [number, number]> = new Map([
  ["2", [0, 2]],
  ["3", [1, 3]],
  ["4", [2, 5]],
  ["5", [3, 7]],
  ["6", [4, 11]],
  ["7", [5, 13]],
  ["8", [6, 17]],
  ["9", [7, 19]],
  ["T", [8, 23]],
  ["J", [9, 29]],
  ["Q", [10, 31]],
  ["K", [11, 37]],
  ["A", [12, 41]],
]);

const suits: Map<string, number> = new Map([
  ["c", 0x8000],
  ["d", 0x4000],
  ["h", 0x2000],
  ["s", 0x1000],
]);

const cardInt = (card: Card): number => {
  const [order, prime] = ranks.get(card.rank)!;
  const suit = suits.get(card.suit)!;
  return prime | (order << 8) | suit | (1 << (16 + order));
};

const findIt = (key: number): number => {
  let low = 0;
  let high = 4887;
  let mid: number;

  while (low <= high) {
    mid = (high + low) >> 1;
    if (key < products[mid]) {
      high = mid - 1;
    } else if (key > products[mid]) {
      low = mid + 1;
    } else {
      return mid;
    }
  }
  throw new Error("Impossible hand");
};

export const evalHand = (hand: Card[]): number => {
  const cards = hand.map(cardInt);
  const q = (cards[0] | cards[1] | cards[2] | cards[3] | cards[4]) >> 16;

  if (cards[0] & cards[1] & cards[2] & cards[3] & cards[4] & 0xf000) {
    return flushes[q];
  }

  const s = uniqueRanks[q];
  if (s) {
    return s;
  }

  const l =
    (cards[0] & 0xff) *
    (cards[1] & 0xff) *
    (cards[2] & 0xff) *
    (cards[3] & 0xff) *
    (cards[4] & 0xff);
  const m = findIt(l);
  return otherRanks[m];
};

export const evalRank = (score: number): string => {
  if (score > 6185) return "High Card";
  if (score > 3325) return "One Pair";
  if (score > 2467) return "Two Pair";
  if (score > 1609) return "Three of a Kind";
  if (score > 1599) return "Straight";
  if (score > 322) return "Flush";
  if (score > 166) return "Full House";
  if (score > 10) return "Four of a Kind";
  if (score > 1) return "Straight Flush";
  return "Royal-Flush";
};
