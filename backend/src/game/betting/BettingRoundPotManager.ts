// src/game/betting/BettingRoundPotManager.ts - Manage pot contributions and splits during a betting round.
import { PlayerInGame } from "../types/PlayerInGame";

export class BettingRoundPotManager {
  private _playerContributions: Map<PlayerInGame, number> = new Map();

  // Validation for amount should happen before calling this, the return type is just for assertion and prevention.
  addContribution(player: PlayerInGame, amount: number): boolean {
    const updatedStack = player.getPlayerPublicState().currentStack - amount;
    if (updatedStack < 0) return false;

    const roundPotContributions =
      (player.getPlayerPublicState().roundPotContributions ?? 0) + amount;

    player.updatePlayerPublicState({
      currentStack: updatedStack,
      isAllIn: updatedStack === 0,
      roundPotContributions: roundPotContributions,
    });

    const currentContribution = this._playerContributions.get(player) || 0;
    const newContribution = currentContribution + amount;
    this._playerContributions.set(player, newContribution);
    return true;
  }

  getRemainingToCall(player: PlayerInGame): number {
    const playerContribution = this._playerContributions.get(player) || 0;
    const biggestBet = Math.max(0, ...this._playerContributions.values());
    return Math.min(biggestBet - playerContribution, player.getStack());
  }

  getPlayersTotalContribution(player: PlayerInGame): number {
    return this._playerContributions.get(player) || 0;
  }

  getContributions(): Map<PlayerInGame, number> {
    return new Map(this._playerContributions);
  }

  // Assuning we forced that BB and SB players have enough stack to put the full preflop blind-bets before sitting into a new hand, this is a simplification at the current scope and should change at some point.
  takeBlinds(
    sbPlayer: PlayerInGame,
    bbPlayer: PlayerInGame,
    smallBlindAmount: number,
    bigBlindAmount: number
  ) {
    this.addContribution(sbPlayer, smallBlindAmount);
    this.addContribution(bbPlayer, bigBlindAmount);
  }
}
