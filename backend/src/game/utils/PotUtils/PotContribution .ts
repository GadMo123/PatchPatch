import { PlayerInGame } from '../../types/PlayerInGame';

export class PotContribution {
  private contributions: Map<PlayerInGame, number> = new Map();

  addContribution(player: PlayerInGame, amount: number) {
    const currentContribution = this.contributions.get(player) || 0;
    this.contributions.set(player, currentContribution + amount);
  }

  getTotalContribution(player: PlayerInGame): number {
    return this.contributions.get(player) || 0;
  }

  getContributors(): Set<PlayerInGame> {
    return new Set(this.contributions.keys());
  }

  getTotalPotSize(): number {
    return Array.from(this.contributions.values()).reduce(
      (sum, amount) => sum + amount,
      0
    );
  }
}
