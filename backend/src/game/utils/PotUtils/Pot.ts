import { Card } from '../../types/Card';
import { PlayerInGame } from '../../types/PlayerInGame';
import { OmahaHandEvaluator } from '../OmahaHandEvaluator';
import { PotContribution } from './PotContribution ';

export class Pot {
  private sidePots: PotContribution[] = [];
  private mainPot: PotContribution;

  constructor() {
    this.mainPot = new PotContribution();
  }

  processBettingRound(
    players: PlayerInGame[],
    bets: Map<PlayerInGame, number>
  ) {
    // Sort players by their contribution amount to the pot
    const sortedPlayers = [...players].sort(
      (a, b) => (bets.get(a) || 0) - (bets.get(b) || 0)
    );

    let remainingBets = new Map(bets);

    while (remainingBets.size > 0) {
      // Find the lowest bet amount
      const lowestBet = Math.min(...Array.from(remainingBets.values()));

      // Create side pot for players who can contribute at this level
      const sidePotContributors = sortedPlayers.filter(
        player => (remainingBets.get(player) || 0) >= lowestBet
      );

      const sidePot = new PotContribution();

      // Collect contributions to the next side pot
      for (const player of sidePotContributors) {
        const playerBet = remainingBets.get(player) || 0;
        sidePot.addContribution(player, lowestBet);
        remainingBets.set(player, playerBet - lowestBet);
      }

      // Add side pot if it has contributions
      if (sidePot.getTotalPotSize() > 0) {
        this.sidePots.push(sidePot);
      }

      // Remove players with zero remaining bet
      remainingBets = new Map(
        Array.from(remainingBets.entries()).filter(([, amount]) => amount > 0)
      );
    }

    // Check if main pot contains only one player:
    // When a player bets more than all-in anount of all other active players -
    // return the bet diractlly to his stack after the betting round (without processing it as a side pot).
    const mainPotContributors = this.mainPot.getContributors();
    if (mainPotContributors.size === 1) {
      const singlePlayer = Array.from(mainPotContributors)[0];
      singlePlayer.increaseStack(this.mainPot.getTotalPotSize());
    }
  }

  distributeWinningsInShowdown(
    boardCards: Card[],
    winningScores: Map<PlayerInGame, number>
  ): Map<PlayerInGame, number> {
    const winnings = new Map<PlayerInGame, number>();

    // Add main pot to side pots for distribution
    this.sidePots.push(this.mainPot);

    for (const pot of this.sidePots) {
      const potContributors = Array.from(pot.getContributors());

      // Filter winners from this pot based on pre-calculated scores
      const potWinners = new Set(
        potContributors.filter(
          player =>
            winningScores.get(player) ===
            Math.min(...potContributors.map(p => winningScores.get(p)!))
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
    for (const player of this.mainPot.getContributors()) {
      allContributors.add(player);
    }

    // Add contributors from side pots
    for (const sidePot of this.sidePots) {
      for (const player of sidePot.getContributors()) {
        allContributors.add(player);
      }
    }

    return Array.from(allContributors);
  }
}
