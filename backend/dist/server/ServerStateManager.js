"use strict";
// src/server/ServerStateManager.ts - Saves the state of the server, atm locally and in the future via database.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerStateManager = void 0;
//todo : all shared data access should be async,
class ServerStateManager {
    constructor() {
        this._players = {};
        this._games = {};
    }
    static getInstance() {
        if (!ServerStateManager._instance) {
            ServerStateManager._instance = new ServerStateManager();
        }
        return ServerStateManager._instance;
    }
    getPlayers() {
        return this._players;
    }
    getPlayer(playerId) {
        return this._players[playerId] || null;
    }
    addPlayer(player) {
        this._players[player.getId()] = player;
    }
    removePlayer(playerId) {
        delete this._players[playerId];
    }
    getGames() {
        return this._games;
    }
    getGame(gameId) {
        return this._games[gameId] || null;
    }
    addGame(game) {
        this._games[game.getId()] = game;
    }
    removeGame(gameId) {
        delete this._games[gameId];
    }
}
exports.ServerStateManager = ServerStateManager;
//# sourceMappingURL=ServerStateManager.js.map