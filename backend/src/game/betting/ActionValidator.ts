// src/game/betting/ActionValidator.ts
import { PlayerInGame } from '../types/PlayerInGame';
import {
  PlayerAction,
  BettingState,
  ActionValidationResult,
  BettingConfig,
} from './BettingTypes';

export class ActionValidator {
  constructor(private config: BettingConfig) {}

  getValidActions(
    bettingState: BettingState,
    player: PlayerInGame
  ): PlayerAction[] {
    const { currentBet, lastAction } = bettingState;

    // First to act
    if (!lastAction) {
      return ['check', 'bet'];
    }

    // Facing a bet/raise
    if (currentBet > 0) {
      const actions: PlayerAction[] = ['fold', 'call'];
      if (this.canRaise(player, currentBet)) {
        actions.push('raise');
      }
      return actions;
    }

    // After a check
    return ['check', 'bet'];
  }

  validateAction(
    action: PlayerAction,
    amount: number | undefined,
    player: PlayerInGame,
    validActions: PlayerAction[]
  ): ActionValidationResult {
    if (!validActions.includes(action)) {
      return { isValid: false, error: 'Invalid action for current state' };
    }

    if (action === 'bet' || action === 'raise') {
      if (!amount)
        return { isValid: false, error: 'Amount required for bet/raise' };
      if (amount < this.config.minBet)
        return { isValid: false, error: 'Bet below minimum' };
      if (amount > this.config.maxBet)
        return { isValid: false, error: 'Bet above maximum' };
      if (amount > player.getStack())
        return { isValid: false, error: 'Insufficient funds' };
    }

    return { isValid: true };
  }

  private canRaise(player: PlayerInGame, currentBet: number): boolean {
    return player.getStack() > currentBet;
  }
}
