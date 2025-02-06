"use strict";
// src/server/SocketProtocol.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = void 0;
exports.SocketEvents = {
    LOGIN: "login",
    ENTER_GAME: "enter-game",
    JOIN_GAME: "join-game",
    GAME_BUYIN: "game-buyin",
    PLAYER_ACTION: "player-action",
    CARDS_ARRANGEMENT: "cards-arrangement",
    LOBBY_STATUS: "lobby-status",
    USE_TIMEBANK: "use-timebank",
    GAME_STATE_UPDATE: "game-state-update",
    SIT_OUT_NEXT_HAND: "sit-out-next-hand",
    STAND_UP: "stand-up",
    EXIT_GAME: "exit-game", // Exit game view back to lobby / homepage
};
