import { describe, expect, it } from "@jest/globals";
import { Card, Rank, Suit } from "@patchpatch/shared";
import PokerHandEvaluator from "game/utils/OmahaHandEvaluator";

describe("PokerHandEvaluator", () => {
  // Helper function to create cards
  const createCard = (card: string): Card => {
    return new Card(card[0] as Rank, card[1] as Suit);
  };

  // Helper function to create a hand from string notation
  const createHand = (cards: string[]): Card[] => {
    return cards.map(createCard);
  };

  describe("findBestOmahaHand", () => {
    it("should find a royal flush", () => {
      const board = createHand(["Ah", "Kh", "Qh", "Jd", "4c"]);
      const playerHand = createHand(["Th", "Jh", "2d", "3s"]);
      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      console.log("123 " + result.value);
      expect(result.category).toBe("Royal-Flush");
    });

    it("should find a straight flush", () => {
      const board = createHand(["9h", "8h", "7h", "4d", "2c"]);
      const playerHand = createHand(["Th", "6h", "As", "Kd"]);

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("Straight Flush");
    });

    it("should find four of a kind", () => {
      const board = createHand(["Ah", "Ad", "Ac", "Kh", "Qd"]);
      const playerHand = createHand(["As", "2h", "3c", "4d"]);

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("Four of a Kind");
    });

    it("should find a full house", () => {
      const board = createHand(["Kh", "Kd", "Kc", "4h", "4d"]);
      const playerHand = createHand(["Ah", "Ad", "2c", "3s"]);

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("Full House");
    });

    it("should find a flush", () => {
      const board = createHand(["2h", "5h", "8h", "Kd", "4c"]);
      const playerHand = createHand(["Ah", "Jh", "2c", "3s"]);

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("Flush");
    });

    it("should find a straight", () => {
      const board = createHand(["8d", "9h", "Tc", "Jd", "Qc"]);
      const playerHand = createHand(["7h", "Kd", "Jc", "3s"]);

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("Straight");
    });

    it("should find three of a kind", () => {
      const board = createHand(["Ah", "Ad", "2c", "7h", "8d"]);
      const playerHand = createHand(["As", "Kh", "Qc", "Jd"]);

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("Three of a Kind");
    });

    it("should find two pair", () => {
      const board = createHand(["Ah", "Ad", "Kh", "Qd", "2c"]);
      const playerHand = createHand(["Kd", "Jh", "5s", "9c"]);

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("Two Pair");
    });

    it("should find one pair", () => {
      const board = createHand(["Ah", "Kd", "Qc", "Jd", "9s"]);
      const playerHand = createHand(["Ad", "2h", "3c", "4s"]);

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("One Pair");
    });

    it("should find high card", () => {
      const board = createHand(["2d", "4h", "8c", "9s", "Th"]);
      const playerHand = createHand(["Ah", "3d", "5c", "7s"]);

      // This hand should result in a high card A (no pairs or better)
      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("High Card");
    });

    it("should respect Omaha rules by using exactly 2 hole cards", () => {
      const board = createHand(["Ah", "Ad", "Ac", "As", "Qd"]);
      const playerHand = createHand(["2h", "3d", "4c", "5d"]);

      // Even though there are 3 aces on the board, Omaha rules require using exactly 2 hole cards
      // So four of a kind isn't possible here
      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).not.toBe("Four of a Kind");
    });

    it("should find the best hand when multiple combinations are possible", () => {
      const board = createHand(["Ah", "Kh", "Qh", "Jh", "9c"]);
      const playerHand = createHand(["Th", "9h", "As", "Ad"]);

      // Could make a royal flush (A-K-Q-J-T of hearts) or four aces
      // Royal flush is better
      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      expect(result.category).toBe("Straight Flush");
    });
  });

  // Test edge cases
  describe("edge cases", () => {
    it("should work with different board and hand sizes", () => {
      // Testing with different numbers of cards on board and in hand
      // Omaha normally has 5 board cards and 4 hole cards
      const board = createHand(["Ah", "Kh", "Qh", "Jh"]); // Only 4 board cards
      const playerHand = createHand(["Th", "9h", "8h"]); // Only 3 hole cards

      const result = PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      // Specific result isn't as important as the fact that it runs without error
      expect(result).toBeDefined();
      expect(result.category).toBeDefined();
    });
  });

  // Performance test
  describe("performance", () => {
    it("should evaluate hands in a reasonable time", () => {
      const start = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const board = createHand(["Ah", "Kd", "Qc", "Js", "Th"]);
        const playerHand = createHand(["9d", "8c", "7s", "6h"]);
        PokerHandEvaluator.findBestOmahaHand(board, playerHand);
      }

      const end = Date.now();
      const timePerEvaluation = (end - start) / iterations;

      // The time threshold depends on your performance requirements
      // This is just an example - adjust as needed
      expect(timePerEvaluation).toBeLessThan(50); // Should take less than 50ms per evaluation
      console.log(`Average time per hand evaluation: ${timePerEvaluation}ms`);
    });
  });
});
