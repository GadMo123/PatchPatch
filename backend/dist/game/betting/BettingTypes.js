"use strict";
// src/game/betting/BettingTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTableConfig = getTableConfig;
function getTableConfig(timePerAction, minBet, maxBet, timeCookieEffect, sbAmount, bbAmount, minPlayers) {
    return {
        timePerAction: timePerAction,
        minBet: minBet,
        maxBet: maxBet,
        timeCookieEffect: timeCookieEffect,
        sbAmount: sbAmount,
        bbAmount: bbAmount,
        minPlayers: minPlayers,
    };
}
//# sourceMappingURL=BettingTypes.js.map