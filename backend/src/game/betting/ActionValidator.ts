// src/game/betting/ActionValidator.ts - Validates that player input fits games logic (behind type handling which happens in server handlers).
import { BettingTypes } from "@patchpatch/shared";
import { PlayerInGame } from "../types/PlayerInGame";
import {
  BettingState,
  ActionValidationResult,
  TableConfig,
} from "./BettingTypes";

export class ActionValidator {
  constructor(private _config: TableConfig) {}

  getValidActions(
    bettingState: BettingState,
    player: PlayerInGame,
    biggestBet: number
  ): BettingTypes[] {
    const playersContribution = bettingState.potContributions;

    const playerContribution = playersContribution.get(player);

    // First to act or BB option in preflop round
    if (playerContribution === biggestBet) {
      return [BettingTypes.CHECK, BettingTypes.BET];
    }

    const actions: BettingTypes[] = [BettingTypes.FOLD, BettingTypes.CALL];

    if (player.getStack() + playerContribution! > biggestBet) {
      actions.push(BettingTypes.RAISE);
    }
    return actions;
  }

  validateAction(
    action: BettingTypes,
    amount: number | undefined,
    player: PlayerInGame,
    validActions: BettingTypes[]
  ): ActionValidationResult {
    if (!validActions.includes(action)) {
      return { isValid: false, error: "Invalid action for current state" };
    }
    if (action === "bet" || action === "raise" || action === "call") {
      if (!amount)
        return { isValid: false, error: "Amount required for bet/raise/call" };
      if (amount > player.getStack())
        return { isValid: false, error: "Insufficient funds" };
      if (amount < 0) return { isValid: false, error: "amount too low" };
      if (action === "bet" || action === "raise") {
        if (amount < this._config.minBet)
          return { isValid: false, error: "Bet below minimum" };
        if (amount > this._config.maxBet)
          // todo: max raise is relative to pot in pot-limit games, pot-limit games are not in the current scope.
          return { isValid: false, error: "Bet above maximum" };
      }
    }

    return { isValid: true };
  }
}
