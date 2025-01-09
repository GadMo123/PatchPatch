// src/game/betting/ActionHandler.ts

import { Game } from '../Game';
import { PlayerInGame } from '../../player/PlayerInGame';
import { BettingState, PlayerAction } from './types';

export class ActionHandler {
  constructor(private game: Game) {}

  handleFold(player: PlayerInGame): void {
    player.setFolded(true);
    // Find and reward the winner
    const winner = // The player who didn't fold is the winner
      this.game.getBigBlindPlayer()!.id == player.id
        ? this.game.getSmallBlindPlayer()!
        : this.game.getBigBlindPlayer()!;

    this.game.handWonWithoutShowdown(winner); // Notify game that current hand is won
  }

  processAction(
    action: PlayerAction,
    amount: number | undefined,
    player: PlayerInGame,
    bettingState: BettingState
  ): void {
    switch (action) {
      case 'fold':
        this.handleFold(player);
        break;
      case 'check':
        this.handleCheck();
        break;
      case 'call':
        this.handleCall(player, bettingState.currentBet);
        break;
      case 'bet':
        this.handleBet(player, amount!, bettingState);
        break;
      case 'raise':
        this.handleRaise(player, amount!, bettingState);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  handleCheck(): void {
    // No action needed for check
  }

  handleCall(player: PlayerInGame, currentBet: number): void {
    player.removeFromStack(currentBet);
  }

  handleBet(
    player: PlayerInGame,
    amount: number,
    bettingState: BettingState
  ): void {
    player.removeFromStack(amount);
    bettingState.currentBet = amount;
    bettingState.lastRaiseAmount = amount;
  }

  handleRaise(
    player: PlayerInGame,
    amount: number,
    bettingState: BettingState
  ): void {
    this.handleCall(player, bettingState.currentBet);
    player.removeFromStack(amount);
    bettingState.currentBet = amount;
    bettingState.lastRaiseAmount = amount;
  }
}
