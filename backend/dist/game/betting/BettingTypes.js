"use strict";
// src/game/betting/BettingTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTableConfig = getTableConfig;
function getTableConfig(timePerAction, minBet, maxBet, timeCookieEffect, sbAmount, bbAmount, minPlayers, maxPlayers, minBuyin, maxBuyin) {
    return {
        timePerAction: timePerAction,
        minBet: minBet,
        maxBet: maxBet,
        timeCookieEffect: timeCookieEffect,
        sbAmount: sbAmount,
        bbAmount: bbAmount,
        minPlayers: minPlayers,
        maxPlayers: maxPlayers,
        maxBuyin: maxBuyin,
        minBuyin: minBuyin,
    };
}
//# sourceMappingURL=BettingTypes.js.map