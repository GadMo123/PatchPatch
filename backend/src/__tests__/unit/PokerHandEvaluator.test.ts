import { Card, Rank, Suit } from "@patchpatch/shared";
import PokerHandEvaluator from "game/utils/OmahaHandEvaluator";

// Temporarily make evaluateHand public for testing
// Alternatively, use a type assertion or refactor to expose it
const evaluator = PokerHandEvaluator as any; // Type assertion to access private method

describe("PokerHandEvaluator.evaluateHand", () => {
  // Helper to create a card
  const createCard = (rank: string, suit: string): Card => {
    return new Card(rank as Rank, suit as Suit);
  };

  test("should correctly evaluate a royal flush (Ace high straight flush)", () => {
    const hand: Card[] = [
      createCard("A", "s"),
      createCard("K", "s"),
      createCard("Q", "s"),
      createCard("J", "s"),
      createCard("T", "s"),
    ];
    const result = evaluator.evaluateHand(hand);
    expect(result).toBeGreaterThanOrEqual(0); // Straight flush range
    expect(result).toBeLessThanOrEqual(10); // Royal flush is typically 1
  });

  test("should correctly evaluate four of a kind", () => {
    const hand: Card[] = [
      createCard("A", "s"),
      createCard("A", "h"),
      createCard("A", "d"),
      createCard("A", "c"),
      createCard("2", "s"),
    ];
    const result = evaluator.evaluateHand(hand);
    expect(result).toBeGreaterThanOrEqual(11); // Four of a kind range
    expect(result).toBeLessThanOrEqual(166);
  });

  test("should correctly evaluate a full house", () => {
    const hand: Card[] = [
      createCard("K", "s"),
      createCard("K", "h"),
      createCard("K", "d"),
      createCard("Q", "c"),
      createCard("Q", "s"),
    ];
    const result = evaluator.evaluateHand(hand);
    expect(result).toBeGreaterThanOrEqual(167); // Full house range
    expect(result).toBeLessThanOrEqual(322);
  });

  test("should correctly evaluate a straight", () => {
    const hand: Card[] = [
      createCard("5", "s"),
      createCard("4", "h"),
      createCard("3", "d"),
      createCard("2", "c"),
      createCard("A", "s"),
    ];
    const result = evaluator.evaluateHand(hand);
    expect(result).toBeGreaterThanOrEqual(1600); // Straight range
    expect(result).toBeLessThanOrEqual(1609);
  });

  test("should correctly evaluate a high card", () => {
    const hand: Card[] = [
      createCard("A", "s"),
      createCard("K", "h"),
      createCard("9", "d"),
      createCard("5", "c"),
      createCard("2", "s"),
    ];
    const result = evaluator.evaluateHand(hand);
    expect(result).toBeGreaterThanOrEqual(6186); // High card range
    expect(result).toBeLessThanOrEqual(7462);
  });
});
