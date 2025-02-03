"use strict";
// src/server/singleGameManager.ts
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
exports.SingleGameFlowManager = void 0;
/* This is a helper to manage all the single game life cycle, manage all the flow of a single game*/
const ArrangePlayerCardsManager_1 = require("../arrangeCards/ArrangePlayerCardsManager");
const BettingManager_1 = require("../betting/BettingManager");
const GameState_1 = require("../broadcasting/GameState");
class SingleGameFlowManager {
    constructor(_game) {
        this._game = _game;
        this._bettingManager = null;
        this._arrangePlayerCardsManager = null;
    }
    startNextStreet() {
        switch (this._game.getPhase()) {
            case GameState_1.GamePhase.Showdown:
                this.prapereNextHand();
            case GameState_1.GamePhase.Waiting:
                this.dealPreflop();
                break;
            case GameState_1.GamePhase.PreflopBetting:
                this.dealFlops();
                break;
            case GameState_1.GamePhase.ArrangePlayerCards:
                this.startArrangePlayerCards();
                break;
            case GameState_1.GamePhase.FlopBetting:
                this.dealTurn();
                break;
            case GameState_1.GamePhase.TurnBetting:
                this.dealRiver();
                break;
        }
    }
    prapereNextHand() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._game.PrepareNextHand();
            this._game.updateGameStateAndBroadcast({}, this.startBettingRound.bind(this));
        });
    }
    dealPreflop() {
        this._game.dealNewHand();
        this._game.updateGameStateAndBroadcast({}, this.startBettingRound.bind(this));
    }
    dealFlops() {
        this._game.updateGameStateAndBroadcast({
            flops: this._game.dealFlops(),
            phase: GameState_1.GamePhase.ArrangePlayerCards,
        }, this.startArrangePlayerCards.bind(this));
    }
    dealTurn() {
        this._game.updateGameStateAndBroadcast({
            turns: this._game.dealTurns(),
            phase: GameState_1.GamePhase.TurnBetting,
        }, this.startBettingRound.bind(this));
    }
    dealRiver() {
        this._game.updateGameStateAndBroadcast({
            rivers: this._game.dealRivers(),
            phase: GameState_1.GamePhase.RiverBetting,
        }, this.startBettingRound.bind(this));
        // Todo : start cacl winner right here as a microservice to find the winner by the time of showdown
    }
    startBettingRound() {
        const bettingManager = new BettingManager_1.BettingManager(this._game, this._game.getTableConfig(), this.onBettingRoundComplete.bind(this), this._game.getPhase() === GameState_1.GamePhase.PreflopBetting);
        this._bettingManager = bettingManager;
        bettingManager.startNextPlayerTurn();
    }
    startArrangePlayerCards() {
        console.log('Card Arrange start -' + this._game.getPhase());
        this._arrangePlayerCardsManager = new ArrangePlayerCardsManager_1.ArrangePlayerCardsManager(this._game, this.onCardArrangeDone.bind(this));
    }
    onCardArrangeDone() {
        console.log('Card Arrange Done -' + this._game.getPhase());
        this._arrangePlayerCardsManager = null;
        this._game.updateGameStateAndBroadcast({
            arrangePlayerCardsState: null,
            phase: GameState_1.GamePhase.FlopBetting,
        }, this.startBettingRound.bind(this));
    }
    onBettingRoundComplete(winner) {
        console.log('betting round complete -' + this._game.getPhase());
        if (winner)
            this._game.handleHandWonWithoutShowdown(winner);
        this._game.updateGameStateAndBroadcast({ bettingState: null }, this.afterBettingDetermineNextStep.bind(this));
    }
    afterBettingDetermineNextStep() {
        //hand is done
        if (this._game.isHandWonWithoutShowdown()) {
            if (this._game.isReadyForNextHand())
                this.startNextStreet();
            // else wait for players to join, the server will create a new game manager once ready
        }
        else if (this._game.getPhase() === GameState_1.GamePhase.RiverBetting) {
            this._game.doShowdown();
            if (this._game.isReadyForNextHand()) {
                this.startNextStreet();
            }
        }
        // Keep current hand running
        else {
            this.startNextStreet();
        }
    }
    getBettingManager() {
        return this._bettingManager;
    }
    getArrangeCardManager() {
        return this._arrangePlayerCardsManager;
    }
}
exports.SingleGameFlowManager = SingleGameFlowManager;
//# sourceMappingURL=SingleGameFlowManager.js.map