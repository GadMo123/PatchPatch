"use strict";
// src/lobby/LobbyManager.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLobbyStatus = getLobbyStatus;
const GameState_1 = require("../game/broadcasting/GameState");
function getLobbyStatus(games) {
    const gameList = Object.values(games).map((game) => {
        var _a, _b;
        return ({
            id: game.getId(),
            blindLevel: game.getStakes(),
            players: (_b = Array.from(((_a = game.getPlayersInGame()) === null || _a === void 0 ? void 0 : _a.values()) || []).map((player) => (player === null || player === void 0 ? void 0 : player.getName()) || "Empty")) !== null && _b !== void 0 ? _b : [],
            status: game.getStatus() === GameState_1.GamePhase.Waiting ? "waiting" : "running",
            maxPlayers: game.getTableConfig().maxPlayers,
        });
    });
    return { success: true, games: gameList };
}
//# sourceMappingURL=LobbyManager.js.map