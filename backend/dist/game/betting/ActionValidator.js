"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionValidator = void 0;
class ActionValidator {
    constructor(_config) {
        this._config = _config;
    }
    getValidActions(bettingState, player, biggestBet) {
        const playersContribution = bettingState.potContributions;
        const playerContribution = playersContribution.get(player);
        // First to act or BB option in preflop round
        if (playerContribution === biggestBet) {
            return ["check", "bet"];
        }
        const actions = ["fold", "call"];
        if (player.getStack() + playerContribution > biggestBet) {
            actions.push("raise");
        }
        return actions;
    }
    validateAction(action, amount, player, validActions) {
        if (!validActions.includes(action)) {
            return { isValid: false, error: "Invalid action for current state" };
        }
        if (action === "bet" || action === "raise" || action === "call") {
            if (!amount)
                return { isValid: false, error: "Amount required for bet/raise/call" };
            if (amount > player.getStack())
                return { isValid: false, error: "Insufficient funds" };
            if (amount < 0)
                return { isValid: false, error: "amount too low" };
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
exports.ActionValidator = ActionValidator;
//# sourceMappingURL=ActionValidator.js.map