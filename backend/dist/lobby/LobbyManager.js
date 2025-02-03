"use strict";
// src/lobby/LobbyManager.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLobbyStatus = getLobbyStatus;
const GameState_1 = require("../game/broadcasting/GameState");
function getLobbyStatus(games) {
    const gameList = Object.values(games).map(game => {
        var _a;
        return ({
            id: game.getId(),
            blindLevel: game.getStakes(),
            players: Array.from(((_a = game.getPlayersInGame()) === null || _a === void 0 ? void 0 : _a.values()) || []).map(player => (player === null || player === void 0 ? void 0 : player.getName()) || 'empty'),
            status: game.getStatus() === GameState_1.GamePhase.Waiting ? 'waiting' : 'running',
        });
    });
    return { success: true, games: gameList };
}
//# sourceMappingURL=LobbyManager.js.map