"use strict";
// src\game\arrangeCards\ArrangePlayerCardsManager.ts - Handles card arrangement phase - timers, broadcasts, validations, default action.
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
exports.ArrangePlayerCardsManager = void 0;
const GameActionTimerManager_1 = require("../utils/GameActionTimerManager");
const PlayerArrangementValidator_1 = require("./PlayerArrangementValidator");
class ArrangePlayerCardsManager {
    constructor(_game, OnArrangeDone) {
        this._game = _game;
        // Initialize player done map and count
        const playerDoneMap = new Map();
        let activePlayerCount = 0;
        const playersInGame = _game.getPlayersInGame();
        if (playersInGame) {
            playersInGame.forEach((player, position) => {
                if (player && player.isFolded()) {
                    playerDoneMap.set(position, false);
                    activePlayerCount++;
                }
            });
        }
        this._playersRemaining = activePlayerCount;
        this._state = {
            timeRemaining: 60000, // todo table config
            playerDoneMap: playerDoneMap,
        };
        this._timer = new GameActionTimerManager_1.GameActionTimerManager({
            duration: this._state.timeRemaining,
            networkBuffer: 1000,
            timeCookieEffect: _game.getTableConfig().timeCookieEffect,
            maxCookiesPerRound: 3,
            updateTimeRemianing: (timeRemaining) => this.updateTimeRemianing(timeRemaining),
            onTimeout: OnArrangeDone,
            onComplete: OnArrangeDone,
        });
        this._timer.start();
    }
    handlePlayerArrangedCardsRecived(playerId, arrangement) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const player = (_b = Array.from(((_a = this._game.getPlayersInGame()) === null || _a === void 0 ? void 0 : _a.entries()) || []).find(([_, p]) => (p === null || p === void 0 ? void 0 : p.getId()) === playerId)) === null || _b === void 0 ? void 0 : _b[1];
            if (!player) {
                return { success: false, error: "Player not found" };
            }
            if (this._state.playerDoneMap.get(player.getPosition()) === true) {
                return { success: false, error: "Player already submitted arrangement" };
            }
            const validationResult = (0, PlayerArrangementValidator_1.validateCardsArrangement)(arrangement, player);
            console.log(validationResult.cards);
            if (!validationResult.isValid) {
                return { success: false, error: validationResult.error };
            }
            // Update player's arranged cards
            player.updatePlayerPrivateState({
                cards: arrangement,
            });
            // Mark player as done
            this.markPlayerDone(player.getPosition());
            if (this.isAllPlayersDone()) {
                this._timer.handleAction(); // Signal that we received valid actions, cancel timout action
            }
            return { success: true };
        });
    }
    markPlayerDone(position) {
        if (this._state.playerDoneMap.get(position) === false) {
            this._state.playerDoneMap.set(position, true);
            this._playersRemaining--;
            // Update game state to broadcast progress
            this._game.updateGameStateAndBroadcast({
                arrangePlayerCardsState: this._state,
            }, null);
        }
    }
    updateTimeRemianing(timeRemaining) {
        this._state.timeRemaining = timeRemaining;
        this._game.updateGameStateAndBroadcast({
            arrangePlayerCardsState: this._state,
        }, null);
    }
    isAllPlayersDone() {
        return this._playersRemaining === 0;
    }
}
exports.ArrangePlayerCardsManager = ArrangePlayerCardsManager;
//# sourceMappingURL=ArrangePlayerCardsManager.js.map