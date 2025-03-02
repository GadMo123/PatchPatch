// src\game\utils\PotUtils\PotManager.ts - Manage game pots, splits pots by contributers in case some players are all in, distribute winnings.
//  notice the convention break - ⚠ ⚠ ⚠.

import { PlayerInGame } from "../../types/PlayerInGame";
import { PotContribution } from "./PotContribution";

export class PotManager {
  private _sidePots: PotContribution[] = [];
  //  ⚠ ⚠ ⚠ Notice - "main-pot" as defined here is the currently active pot, which goes against the normal poker-conventions (where main-pot is the pot with most contributors)
  //  this makes everything more understandable in coding terms.
  private _mainPot: PotContribution;

  constructor() {
    this._mainPot = new PotContribution();
  }

  // Once betting round complate - collect all players bets and arrange them into side pots by players contributions, the last pot standing will be the main pot until next betting round.
  processBettingRound(bets: Map<PlayerInGame, number>) {
    // Extract and sort players by bet amount (increasing order)
    const players = Array.from(bets.keys());

    // Track remaining bets
    const remainingBets = new Map(bets);

    // Track the last pot with 2+ contributors - to become the main pot at the end of this betting round
    let lastMultiContributorPot: PotContribution = this._mainPot;

    while (remainingBets.size > 0) {
      // Find minimum bet amount among remaining players
      const minBet = Math.min(...Array.from(remainingBets.values()));

      // Get contributors at this level
      const contributors = players.filter(
        (player) => (remainingBets.get(player) || 0) > 0
      );

      // Check if we should add to main pot or create a new pot
      if (
        this.sameContributors(
          this._mainPot.getContributors(),
          new Set(contributors)
        )
      ) {
        // Add to existing main pot if contributors match
        for (const player of contributors) {
          const contribution = Math.min(minBet, remainingBets.get(player) || 0);
          this._mainPot.addContribution(player, contribution);
          remainingBets.set(
            player,
            (remainingBets.get(player) || 0) - contribution
          );
        }
      } else {
        // Push current main pot to side pots if it has contributions
        if (this._mainPot.getTotalPotSize() > 0) {
          this._sidePots.push(this._mainPot);
        }

        // Create new main pot
        this._mainPot = new PotContribution();
        for (const player of contributors) {
          const contribution = Math.min(minBet, remainingBets.get(player) || 0);
          this._mainPot.addContribution(player, contribution);
          remainingBets.set(
            player,
            (remainingBets.get(player) || 0) - contribution
          );
        }
      }

      // Keep track of the last pot with multiple contributors
      if (contributors.length >= 2) {
        lastMultiContributorPot = this._mainPot;
      }

      // Remove players with zero remaining bets
      for (const player of Array.from(remainingBets.keys())) {
        if ((remainingBets.get(player) || 0) <= 0) {
          remainingBets.delete(player);
        }
      }
    }

    this.finalizeRound(lastMultiContributorPot, players);
  }

  // Helper to check if two sets of contributors are the same
  private sameContributors(
    set1: Set<PlayerInGame>,
    set2: Set<PlayerInGame>
  ): boolean {
    if (set1.size !== set2.size) return false;
    return Array.from(set1).every((player) => set2.has(player));
  }

  // Handle end of round, reset players pot contributions and return unchallanged bet.
  private finalizeRound(
    lastMultiContributorPot: PotContribution,
    players: Array<PlayerInGame>
  ) {
    // If main pot has only one contributor, return it to the player
    if (this._mainPot.getContributors().size === 1) {
      const singlePlayer = Array.from(this._mainPot.getContributors())[0];
      singlePlayer.updatePlayerPublicState({
        currentStack: singlePlayer.getStack() + this._mainPot.getTotalPotSize(),
      });

      // Set the main pot to the last pot with multiple contributors

      const index = this._sidePots.findIndex(
        // Remove this pot from side pots if it's there
        (pot) => pot === lastMultiContributorPot
      );
      if (index !== -1) {
        this._sidePots.splice(index, 1);
      }
      this._mainPot = lastMultiContributorPot;
    } else {
      // Reset main pot if no multi-contributor pot exists (should never happen since we force SB and BB every hand, but this rule might changes in the future)
      this._mainPot = new PotContribution();
    }

    players.forEach((player) => {
      player.updatePlayerPublicState({
        roundPotContributions: 0,
      });
    });
  }

  distributeWinningsInShowdown(
    winningScores: Map<PlayerInGame, number>
  ): Map<PlayerInGame, number> {
    const winnings = new Map<PlayerInGame, number>();

    // Add main pot to side pots for distribution
    this._sidePots.push(this._mainPot);

    for (const pot of this._sidePots) {
      const potContributors = Array.from(pot.getContributors());

      // Filter winners from this pot based on pre-calculated scores
      const potWinners = new Set(
        potContributors.filter(
          (player) =>
            winningScores.get(player) ===
            Math.min(...potContributors.map((p) => winningScores.get(p)!))
        )
      );

      const potSize = pot.getTotalPotSize();
      const winnerShare = Math.round((potSize / potWinners.size) * 100) / 100;

      for (const winner of potWinners) {
        winnings.set(winner, (winnings.get(winner) || 0) + winnerShare);
      }
    }

    return winnings;
  }

  private getAllPotContributors(): PlayerInGame[] {
    const allContributors = new Set<PlayerInGame>();

    // Add contributors from main pot
    for (const player of this._mainPot.getContributors()) {
      allContributors.add(player);
    }

    // Add contributors from side pots
    for (const sidePot of this._sidePots) {
      for (const player of sidePot.getContributors()) {
        allContributors.add(player);
      }
    }

    return Array.from(allContributors);
  }
}
