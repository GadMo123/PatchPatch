import { PlayerInGame } from "../../types/PlayerInGame";

export class PotContribution {
  private _contributions: Map<PlayerInGame, number> = new Map();

  addContribution(player: PlayerInGame, amount: number) {
    const currentContribution = this._contributions.get(player) || 0;
    this._contributions.set(player, currentContribution + amount);
  }

  getTotalContribution(player: PlayerInGame): number {
    return this._contributions.get(player) || 0;
  }

  getContributors(): Set<PlayerInGame> {
    return new Set(this._contributions.keys());
  }

  getTotalPotSize(): number {
    return Array.from(this._contributions.values()).reduce(
      (sum, amount) => sum + amount,
      0
    );
  }
}
