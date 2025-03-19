import { Card } from "@patchpatch/shared";
import { CactusKev } from "./Cactus-Kev";

// Prime numbers used for card rank mapping (Cactus-Kev's approach)
const primes: number[] = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];

export class PokerHandEvaluator {
  // Generate all valid Omaha hand combinations and sort each one ascending
  private static generateOmahaHandCombinations(
    boardCards: Card[],
    playerCards: Card[]
  ): Card[][] {
    const combinations: Card[][] = [];
    // Precompute all possible board combinations (3 out of 5)
    const boardCombinations: Card[][] = [];

    // Generate all possible 3-card combinations from the board
    this.generateCombinations(boardCards, 3, 0, [], boardCombinations);

    // Generate all possible 2-card combinations from player's hand
    const playerCombinations: Card[][] = [];
    this.generateCombinations(playerCards, 2, 0, [], playerCombinations);

    // Combine each player combination with each board combination
    for (const playerCombo of playerCombinations) {
      for (const boardCombo of boardCombinations) {
        // Create the 5-card hand and sort it
        const hand = [...playerCombo, ...boardCombo];
        combinations.push(hand);
      }
    }
    return combinations;
  }

  // Generic combination generator using recursion
  private static generateCombinations(
    cards: Card[],
    k: number,
    startIndex: number,
    currentCombo: Card[],
    result: Card[][]
  ): void {
    // If we've selected enough cards, add this combination to results
    if (currentCombo.length === k) {
      result.push([...currentCombo]);
      return;
    }

    // Try each possible next card
    for (let i = startIndex; i < cards.length; i++) {
      // Add this card to our current combination
      currentCombo.push(cards[i]);

      // Recurse to select the remaining cards
      this.generateCombinations(cards, k, i + 1, currentCombo, result);

      // Backtrack (remove the card for the next iteration)
      currentCombo.pop();
    }
  }

  public static evaluateHand(hand: Card[]): number {
    return CactusKev.getInstance().evalHand(hand);
  }
  public static handValueToCategory(score: number): string {
    return CactusKev.getInstance().evalRank(score);
  }

  // Evaluate an Omaha hand and return the best hand value
  public static evaluateOmahaHand(
    boardCards: Card[],
    playerCards: Card[]
  ): number {
    const handCombinations = this.generateOmahaHandCombinations(
      boardCards,
      playerCards
    );
    let bestHandValue = 9999; // Lower values are better in Cactus-Kev's system

    // Evaluate each possible 5-card combination
    for (const hand of handCombinations) {
      bestHandValue = Math.min(
        bestHandValue,
        CactusKev.getInstance().evalHand(hand)
      );
    }

    return bestHandValue;
  }

  // Main public method to evaluate and return the best Omaha hand
  public static findBestOmahaHand(
    boardCards: Card[],
    playerCards: Card[]
  ): { value: number; category: string } {
    const bestHandValue = this.evaluateOmahaHand(boardCards, playerCards);
    const category = CactusKev.getInstance().evalRank(bestHandValue);

    return {
      value: bestHandValue,
      category: category,
    };
  }
}

export default PokerHandEvaluator;
