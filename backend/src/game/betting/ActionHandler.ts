// src/game/betting/ActionHandler.ts

import { Game } from '../Game';
import { PlayerInGame } from '../types/PlayerInGame';
import { BettingState, PlayerAction } from './BettingTypes';

export class ActionHandler {
  private game: Game;
  constructor(private theGame: Game) {
    this.game = theGame;
  }

  processAction(
    action: PlayerAction,
    amount: number | undefined,
    player: PlayerInGame,
    bettingState: BettingState,
    afterFunction: (() => void) | null
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
    bettingState.lastAction = action;
    const potSize =
      this.game.getPotSize() + (amount || bettingState.currentBet || 0); // bet or raise ? amount, call ? current bet, check or fold ? 0
    this.game.updateGameStateAndBroadcast(
      {
        potSize: potSize,
        bettingState: bettingState,
      },
      afterFunction
    );
  }

  handleFold(player: PlayerInGame): void {
    player.updatePlayerPublicState({ isFolded: true }); // If game won without showdown, it will be handled in betting manager
  }

  handleCheck(): void {
    // No action needed for check
  }

  handleCall(player: PlayerInGame, currentBet: number): void {
    player.updatePlayerPublicState({
      currentStack: player.getStack() - currentBet,
    });
  }

  handleBet(
    player: PlayerInGame,
    amount: number,
    bettingState: BettingState
  ): void {
    player.updatePlayerPublicState({
      currentStack: player.getStack() - amount,
    });
    bettingState.currentBet = amount;
    bettingState.lastRaiseAmount = amount;
  }

  handleRaise(
    player: PlayerInGame,
    amount: number,
    bettingState: BettingState
  ): void {
    this.handleCall(player, bettingState.currentBet);
    player.updatePlayerPublicState({
      currentStack: player.getStack() - amount,
    });
    bettingState.lastRaiseAmount = amount - bettingState.currentBet; // raise amount is the total amount minus the prev bet
    bettingState.currentBet = amount;
  }
}
