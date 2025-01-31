// src/game/betting/BettingRoundPotManager.ts
import { PlayerInGame } from '../types/PlayerInGame';
import { BettingManager } from './BettingManager';

export class BettingRoundPotManager {
  private _playerContributions: Map<PlayerInGame, number> = new Map();

  constructor(private _bettingManager: BettingManager) {}

  // Validation for amount should happen before calling this, the return type is just for assertion and prevention.
  addContribution(player: PlayerInGame, amount: number): boolean {
    const updatedStack = player.getPlayerPublicState().currentStack - amount;
    if (updatedStack < 0) return false;
    player.updatePlayerPublicState({
      currentStack: updatedStack,
      isAllIn: updatedStack === 0,
    });

    const currentContribution = this._playerContributions.get(player) || 0;
    const newContribution = currentContribution + amount;
    this._playerContributions.set(player, newContribution);
    return true;
  }

  getRemainingToCall(player: PlayerInGame): number {
    const playerContribution = this._playerContributions.get(player) || 0;
    return Math.min(
      this._bettingManager.getBiggestBet() - playerContribution,
      player.getStack()
    );
  }

  getTotalContribution(player: PlayerInGame): number {
    return this._playerContributions.get(player) || 0;
  }

  getAllContributions(): Map<PlayerInGame, number> {
    return new Map(this._playerContributions);
  }

  // we assume in this app that BB and SB players have enough coins to put the full preflop bets, if not, single game manager should not allow them to start the hand.
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
