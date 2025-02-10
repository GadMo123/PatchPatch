"use strict";
// src\server\handlers\SocketHandlers.ts - Handles protocol calls from clients.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketHandlers = void 0;
const Player_1 = require("../../player/Player");
const EventsInputValidator_1 = require("./EventsInputValidator");
const ServerStateManager_1 = require("../ServerStateManager");
const PositionsUtils_1 = require("../../game/utils/PositionsUtils");
class SocketHandlers {
    constructor() {
        this._stateManager = ServerStateManager_1.ServerStateManager.getInstance();
    }
    static getInstance() {
        if (!SocketHandlers._instance) {
            SocketHandlers._instance = new SocketHandlers();
        }
        return SocketHandlers._instance;
    }
    handleLogin(socket, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, EventsInputValidator_1.isLoginPayload)(payload)) {
                return { success: false, message: "Invalid login payload format" };
            }
            try {
                const player = new Player_1.Player(socket.id, payload.name, socket.id);
                this._stateManager.addPlayer(player);
                return { success: true, playerId: player.getId(), token: "1" };
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : "Login failed",
                };
            }
        });
    }
    handleEnterGame(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, EventsInputValidator_1.isInGamePayload)(payload))
                return { success: false, message: "Invalid input" };
            const { game, player } = (0, EventsInputValidator_1.getGameAndPlayer)(payload);
            if (!game || !player) {
                return { success: false, message: "Invalid game and player id" };
            }
            yield game.addObserver(player);
            return { success: true };
        });
    }
    handleJoinGame(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, EventsInputValidator_1.isJoinGamePayload)(payload))
                return { success: false, message: "Invalid input" };
            const { game, player } = (0, EventsInputValidator_1.getGameAndPlayer)(payload);
            if (!game || !player) {
                return { success: false, message: "Invalid game and player id" };
            }
            const position = (0, PositionsUtils_1.getPosition)(payload.position);
            if (!position)
                return { success: false, message: "Invalid position" };
            yield game.addPlayer(player, position);
            player.addActiveGame(payload.gameId);
            return { success: true };
        });
    }
    handleGameBuyin(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, EventsInputValidator_1.isBuyIntoGamePayload)(payload))
                return { success: false, message: "Invalid input" };
            const { game, player } = (0, EventsInputValidator_1.getGameAndPlayer)(payload);
            if (!game || !player) {
                return { success: false, message: "Invalid game and player id" };
            }
            const MIN_BUYIN = Number(process.env.MIN_BUYIN) || 20;
            const amount = payload.amount;
            if (amount < game.getTableConfig().bbAmount * MIN_BUYIN) {
                return { success: false, message: "Invalid amount" };
            }
            const playerInGame = game.getPlayer(player.getId());
            if (!playerInGame)
                return { success: false, message: "Invalid player" };
            //Reduce Coins from base player layer, still not adding chips to game stack (game logic).
            if (!(yield player.buyIntoGame(amount, game)))
                return { success: false, message: "Invalid Buyin" };
            //Add chips to player stack, mark ready / start game based on player and game status.
            game.playerBuyIn(playerInGame, amount);
            return { success: true };
        });
    }
    handlePlayerAction(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!(0, EventsInputValidator_1.isPlayerActionPayload)(payload))
                return { success: false, message: "Invalid input" };
            const { game, player } = (0, EventsInputValidator_1.getGameAndPlayer)(payload);
            if (!game || !player) {
                return { success: false, message: "Invalid game and player id" };
            }
            const { playerId, action, amount } = payload;
            const success = (_c = (yield ((_b = (_a = game
                .getGameFlowManager()) === null || _a === void 0 ? void 0 : _a.getBettingManager()) === null || _b === void 0 ? void 0 : _b.handlePlayerAction(playerId, action, amount)))) !== null && _c !== void 0 ? _c : false;
            return { success: success };
        });
    }
    handleCardArrangement(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!(0, EventsInputValidator_1.isCardArrangementPayload)(payload)) {
                return {
                    success: false,
                    message: "Invalid payload format for card arrangement",
                };
            }
            const { game, player } = (0, EventsInputValidator_1.getGameAndPlayer)(payload);
            if (!game || !player) {
                return { success: false, message: "Invalid game and player id" };
            }
            const { playerId, arrangement } = payload;
            const validCards = arrangement.map((item) => item);
            const result = (_c = (yield ((_b = (_a = game
                .getGameFlowManager()) === null || _a === void 0 ? void 0 : _a.getArrangeCardManager()) === null || _b === void 0 ? void 0 : _b.handlePlayerArrangedCardsRecived(playerId, validCards)))) !== null && _c !== void 0 ? _c : {
                success: false,
            };
            return { success: result.success, message: result.error };
        });
    }
    //Todo
    handleDisconnect(socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const player = this._stateManager.getPlayer(socketId);
            if (player) {
                // Handle player cleanup in active games
                const games = this._stateManager.getGames();
                //todo : player object should keep a list of PlayerInGame which are active, handle dissconection
                //   for (const game of Object.values(games)) {
                //     if (game.getPlayer(socketId)) {
                //       await game.handlePlayerDisconnect(socketId);
                //     }
                //   }
                this._stateManager.removePlayer(socketId);
            }
        });
    }
}
exports.SocketHandlers = SocketHandlers;
//# sourceMappingURL=SocketHandlers.js.map