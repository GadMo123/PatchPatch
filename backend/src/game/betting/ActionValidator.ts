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
    player: PlayerInGame,
    biggestBet: number
  ): PlayerAction[] {
    const playersContribution = bettingState.potContributions;

    const playerContribution = playersContribution.get(player);

    // First to act or BB option in preflop round
    if (playerContribution === biggestBet) {
      return ['check', 'bet'];
    }

    const actions: PlayerAction[] = ['fold', 'call'];

    if (player.getStack() + playerContribution! > biggestBet) {
      actions.push('raise');
    }
    return actions;
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
    if (action === 'bet' || action === 'raise' || action === 'call') {
      if (!amount)
        return { isValid: false, error: 'Amount required for bet/raise/call' };
      if (amount > player.getStack())
        return { isValid: false, error: 'Insufficient funds' };
      if (amount < 0) return { isValid: false, error: 'amount too low' };
      if (action === 'bet' || action === 'raise') {
        if (amount < this.config.minBet)
          return { isValid: false, error: 'Bet below minimum' };
        if (amount > this.config.maxBet)
          // todo: max raise is relative to pot in pot-limit games, pot-limit games are not in the current scope.
          return { isValid: false, error: 'Bet above maximum' };
      }
    }

    return { isValid: true };
  }
}
