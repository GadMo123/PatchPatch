"use strict";
// src/game/broadcasting/GameStateBroadcaster.ts - Broadcasting GameState to all clients involved in a game.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateBroadcaster = void 0;
const GameState_1 = require("./GameState");
class GameStateBroadcaster {
    constructor(_io) {
        this._io = _io;
    }
    broadcastGameState(game, afterFunction) {
        var _a;
        const baseState = (0, GameState_1.getBaseGameState)(game);
        // Broadcast to players in game
        (_a = game.getPlayersInGame()) === null || _a === void 0 ? void 0 : _a.forEach((player, position) => {
            if (player) {
                const playerGameState = Object.assign(Object.assign({}, baseState), { playerPrivateState: player.getPlayerPrivateState() });
                this._io.to(player.getSocketId()).emit("game-state", playerGameState);
            }
        });
        // Broadcast to observers
        game.getObserversList().forEach((observer) => {
            this._io.to(observer.getSocketId()).emit("game-state", baseState);
        });
        // Call afterFunction with a small delay to allow players recive the state
        if (afterFunction) {
            setTimeout(() => {
                afterFunction();
            }, 10);
        }
    }
}
exports.GameStateBroadcaster = GameStateBroadcaster;
//# sourceMappingURL=GameStateBroadcaster.js.map