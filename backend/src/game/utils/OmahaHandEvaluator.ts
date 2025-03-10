// src\game\utils\OmahaHandEvaluator.ts - is a helper that caclulate hand strength in showdown

import { Card, Rank, Suit } from "@patchpatch/shared";

// Enum for Hand Rankings
enum HandRank {
  HighCard,
  Pair,
  TwoPair,
  ThreeOfAKind,
  Straight,
  Flush,
  FullHouse,
  FourOfAKind,
  StraightFlush,
  RoyalFlush,
}

// Conversion utility to map ranks to numeric values for comparison
const rankValues: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14, // using A as 1 for stright should be checked separatlly at any stright check
};

// Represents the evaluation of a poker hand
interface HandEvaluation {
  rank: HandRank;
  primaryValues: Rank[]; // Ranks that determine hand strength
  kickers: Rank[]; // Remaining ranks for tiebreaking
}

export class OmahaHandEvaluator {
  static isFlush(cards: Card[]): boolean {
    return new Set(cards.map((card) => card.suit)).size === 1;
  }

  // Check if a set of ranks forms a straight
  static isStraight(cards: Card[]): boolean {
    const sortedRanks = cards
      .map((card) => rankValues[card.rank])
      .sort((a, b) => a - b);

    // Check for standard straight
    const uniqueSortedRanks = [...new Set(sortedRanks)];
    if (
      uniqueSortedRanks.length === 5 &&
      uniqueSortedRanks[4] - uniqueSortedRanks[0] === 4
    ) {
      return true;
    }

    // Check for wheel straight (A-2-3-4-5)
    if (
      uniqueSortedRanks.includes(14) &&
      [2, 3, 4, 5].every((rank) => uniqueSortedRanks.includes(rank))
    ) {
      return true;
    }
    return false;
  }

  // Evaluate the best 5-card hand from board and player cards
  static evaluateHand(boardCards: Card[], playerCards: Card[]): HandEvaluation {
    // In Omaha, player must use exactly 2 cards from hand and 3 from board
    const allCombinations = this.generateOmahaHandCombinations(
      boardCards,
      playerCards
    );

    // Find the best hand
    return allCombinations.reduce((bestHand, combo) => {
      const currentHand = this.evaluateFiveCardHand(combo);
      return this.compareHands(currentHand, bestHand) > 0
        ? currentHand
        : bestHand;
    }, this.defaultHand());
  }

  // Generate all valid Omaha hand combinations
  private static generateOmahaHandCombinations(
    boardCards: Card[],
    playerCards: Card[]
  ): Card[][] {
    const combinations: Card[][] = [];
    // Player must use exactly 2 cards from their 4-card hand
    for (let i = 0; i < playerCards.length - 1; i++) {
      for (let j = i + 1; j < playerCards.length; j++) {
        // Generate all board card combinations (3 out of 5)
        this.generateBoardCombinations(
          boardCards,
          [playerCards[i], playerCards[j]],
          combinations
        );
      }
    }
    return combinations;
  }

  // Generate board card combinations
  private static generateBoardCombinations(
    boardCards: Card[],
    playerCards: Card[],
    results: Card[][]
  ) {
    for (let i = 0; i < boardCards.length - 2; i++) {
      for (let j = i + 1; j < boardCards.length - 1; j++) {
        for (let k = j + 1; k < boardCards.length; k++) {
          results.push([
            ...playerCards,
            boardCards[i],
            boardCards[j],
            boardCards[k],
          ]);
        }
      }
    }
  }

  // Evaluate a specific 5-card hand
  static evaluateFiveCardHand(cards: Card[]): HandEvaluation {
    // Implement hand ranking logic
    const rankCounts = this.countRanks(cards);
    const suitCounts = this.countSuits(cards);

    // Check for flush
    const isFlush = Object.values(suitCounts).some((count) => count === 5);

    // Check for straight
    const isStraight = this.isStraight(cards);

    // Determine hand rank
    if (isFlush && isStraight) {
      // Check for royal flush
      const sortedRanks = cards
        .map((card) => rankValues[card.rank])
        .sort((a, b) => a - b);

      const isRoyalFlush =
        sortedRanks.includes(10) &&
        sortedRanks.includes(11) &&
        sortedRanks.includes(12) &&
        sortedRanks.includes(13) &&
        sortedRanks.includes(14);

      return {
        rank: isRoyalFlush ? HandRank.RoyalFlush : HandRank.StraightFlush,
        primaryValues: [this.getHighestRank(cards)],
        kickers: this.getKickers(cards, 5),
      };
    }

    // Add more hand ranking logic here
    return {
      rank: HandRank.HighCard,
      primaryValues: [this.getHighestRank(cards)],
      kickers: this.getKickers(cards, 5),
    };
  }

  // Count occurrences of each rank
  private static countRanks(cards: Card[]): Record<Rank, number> {
    return cards.reduce(
      (counts, card) => {
        counts[card.rank] = (counts[card.rank] || 0) + 1;
        return counts;
      },
      {} as Record<Rank, number>
    );
  }

  // Count occurrences of each suit
  private static countSuits(cards: Card[]): Record<Suit, number> {
    return cards.reduce(
      (counts, card) => {
        counts[card.suit] = (counts[card.suit] || 0) + 1;
        return counts;
      },
      {} as Record<Suit, number>
    );
  }

  // Compare two hand evaluations
  static compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
    // Compare hand ranks
    if (hand1.rank !== hand2.rank) {
      return hand1.rank - hand2.rank;
    }

    // Compare primary values
    for (let i = 0; i < hand1.primaryValues.length; i++) {
      const value1 = rankValues[hand1.primaryValues[i]];
      const value2 = rankValues[hand2.primaryValues[i]];
      if (value1 !== value2) {
        return value1 - value2;
      }
    }

    // Compare kickers
    for (let i = 0; i < hand1.kickers.length; i++) {
      const value1 = rankValues[hand1.kickers[i]];
      const value2 = rankValues[hand2.kickers[i]];
      if (value1 !== value2) {
        return value1 - value2;
      }
    }

    return 0; // Hands are exactly equal
  }

  // Get the highest rank in a hand
  private static getHighestRank(cards: Card[]): Rank {
    return cards.reduce(
      (highest, card) =>
        rankValues[card.rank] > rankValues[highest] ? card.rank : highest,
      cards[0].rank
    );
  }

  // Get kickers (remaining cards after primary hand)
  private static getKickers(cards: Card[], count: number): Rank[] {
    return cards
      .map((card) => card.rank)
      .sort((a, b) => rankValues[b] - rankValues[a])
      .slice(0, count);
  }

  // Create a default (lowest) hand for comparison
  private static defaultHand(): HandEvaluation {
    return {
      rank: HandRank.HighCard,
      primaryValues: ["2"],
      kickers: ["2", "3", "4", "5", "6"],
    };
  }
}
