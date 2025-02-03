"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BettingRoundPotManager = void 0;
class BettingRoundPotManager {
    constructor() {
        this._playerContributions = new Map();
    }
    // Validation for amount should happen before calling this, the return type is just for assertion and prevention.
    addContribution(player, amount) {
        const updatedStack = player.getPlayerPublicState().currentStack - amount;
        if (updatedStack < 0)
            return false;
        player.updatePlayerPublicState({
            currentStack: updatedStack,
            isAllIn: updatedStack === 0,
        });
        const currentContribution = this._playerContributions.get(player) || 0;
        const newContribution = currentContribution + amount;
        this._playerContributions.set(player, newContribution);
        return true;
    }
    getRemainingToCall(player) {
        const playerContribution = this._playerContributions.get(player) || 0;
        const biggestBet = Math.max(0, ...this._playerContributions.values());
        return Math.min(biggestBet - playerContribution, player.getStack());
    }
    getPlayersTotalContribution(player) {
        return this._playerContributions.get(player) || 0;
    }
    getContributions() {
        return new Map(this._playerContributions);
    }
    // We forced that BB and SB players have enough stack to put the full preflop bets before sitting into a new hand.
    takeBlinds(sbPlayer, bbPlayer, smallBlindAmount, bigBlindAmount) {
        this.addContribution(sbPlayer, smallBlindAmount);
        this.addContribution(bbPlayer, bigBlindAmount);
    }
}
exports.BettingRoundPotManager = BettingRoundPotManager;
//# sourceMappingURL=BettingRoundPotManager.js.map