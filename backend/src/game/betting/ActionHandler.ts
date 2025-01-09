// src/game/betting/ActionHandler.ts

import { Game } from '../Game';
import { PlayerInGame } from '../../player/PlayerInGame';
import { BettingState, PlayerAction } from './types';

export class ActionHandler {
  constructor(private game: Game) {}

  handleFold(player: PlayerInGame): void {
    player.setFolded(true);
    // Find and reward the winner
    const winner = this.game.getWinner()!; // The player who didn't fold is the winner
    winner.addToStack(this.game.getPotSize());
    this.game.handWonWithoutShowdown(); // Notify game that current hand is done
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
    this.game.increasePotSize(currentBet);
  }

  handleBet(
    player: PlayerInGame,
    amount: number,
    bettingState: BettingState
  ): void {
    player.removeFromStack(amount);
    bettingState.currentBet = amount;
    this.game.increasePotSize(amount);
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
    this.game.increasePotSize(amount);
    bettingState.lastRaiseAmount = amount;
  }
}
