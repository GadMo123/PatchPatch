"use strict";
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
exports.BettingManager = void 0;
const ActionValidator_1 = require("./ActionValidator");
const PositionsUtils_1 = require("../utils/PositionsUtils");
const GameActionTimerManager_1 = require("../utils/GameActionTimerManager");
const BettingRoundPotManager_1 = require("./BettingRoundPotManager");
const async_mutex_1 = require("async-mutex");
class BettingManager {
    constructor(_game, tableConfig, _onBettingRoundComplete, isPreflop) {
        var _a;
        this._game = _game;
        this._onBettingRoundComplete = _onBettingRoundComplete;
        this._actionValidator = new ActionValidator_1.ActionValidator(tableConfig);
        this._currentPlayerToAct = (0, PositionsUtils_1.findFirstPlayerToAct)(this._game);
        this._roundEndsCondition = this._currentPlayerToAct;
        this._biggestBetToCall = 0;
        this._processingAction = new async_mutex_1.Mutex();
        this._awaitingPlayersAction = false;
        this._bettingState = {
            timeRemaining: 0,
            timeCookiesUsedThisRound: 0,
            playerValidActions: [],
            playerToAct: this._currentPlayerToAct.getId(),
            potContributions: new Map(Array.from(_game.getPlayersInGame().values())
                .filter(player => player === null || player === void 0 ? void 0 : player.isActive())
                .map(player => [player, 0])),
        };
        this._potManager = new BettingRoundPotManager_1.BettingRoundPotManager();
        const timebanksPerRound = parseInt((_a = process.env.COOKIES_PER_ROUND) !== null && _a !== void 0 ? _a : '3');
        this._timerManager = new GameActionTimerManager_1.GameActionTimerManager({
            duration: tableConfig.timePerAction,
            networkBuffer: 1000,
            timeCookieEffect: tableConfig.timeCookieEffect,
            maxCookiesPerRound: timebanksPerRound,
            updateTimeRemianing: (timeRemaining) => this.updateBettingState({ timeRemaining: timeRemaining }),
            onTimeout: this.doDefualtActionOnTimeout.bind(this),
            onComplete: this.cleanupTimerState.bind(this),
        });
        if (isPreflop) {
            this._potManager.takeBlinds(_game.getPlayerInPosition(PositionsUtils_1.Position.SB), _game.getPlayerInPosition(PositionsUtils_1.Position.BB), tableConfig.sbAmount, tableConfig.bbAmount);
            this._biggestBetToCall = tableConfig.bbAmount; // for the current scope, we force the BB player (in hand preparation) to have at least 1BB in order to play a hand.
        }
    }
    startNextPlayerTurn() {
        this._bettingState.playerValidActions =
            this._actionValidator.getValidActions(this._bettingState, this._currentPlayerToAct, this._biggestBetToCall);
        console.log('starting player turn ' + this._currentPlayerToAct.getId());
        this._timerManager.start();
        this._awaitingPlayersAction = true;
        this.broadcastBettingState();
    }
    handlePlayerAction(playerId, action, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._processingAction.acquire();
            try {
                if (this._currentPlayerToAct.getId() !== playerId ||
                    !this._awaitingPlayersAction)
                    return false;
                const validActions = this._actionValidator.getValidActions(this._bettingState, this._currentPlayerToAct, this._biggestBetToCall);
                // Calculate call amount in case of 'call' action
                if (action === 'call')
                    amount = this._potManager.getRemainingToCall(this._currentPlayerToAct);
                const validation = this._actionValidator.validateAction(action, amount, this._currentPlayerToAct, validActions);
                if (!validation.isValid) {
                    console.log(`Invalid action: ${validation.error}`);
                    action = validActions.includes('check') ? 'check' : 'fold'; // take default action
                    amount = 0;
                }
                this._potManager.addContribution(this._currentPlayerToAct, amount || 0);
                // When a player raise or bet a valid amount, he has the new biggest bet this round.
                if ((amount !== null && amount !== void 0 ? amount : 0 > 0) && (action == 'raise' || action == 'bet')) {
                    this._roundEndsCondition = this._currentPlayerToAct;
                    this._biggestBetToCall = this._bettingState.potContributions.get(this._currentPlayerToAct);
                }
                if (action == 'fold')
                    this._currentPlayerToAct.updatePlayerPublicState({ isFolded: true });
                // Update betting state with latest pot contributions
                this.updateBettingState({
                    potContributions: this._potManager.getContributions(),
                });
                this._timerManager.handleAction(); // Signal timer that we recived a valid action from the player
                this._awaitingPlayersAction = false;
                this._processingAction.release();
                // Run after returning true
                setImmediate(() => this.onPlayerActionDone());
                return true;
            }
            catch (error) {
                return false;
            }
            finally {
                this._processingAction.release();
            }
        });
    }
    cleanupTimerState() {
        this.updateBettingState({
            timeRemaining: 0,
            timeCookiesUsedThisRound: 0,
        });
    }
    onPlayerActionDone() {
        console.log('onPlayerActionDone ');
        const lastPlayer = this._currentPlayerToAct;
        this.switchToNextPlayer();
        if (this.isBettingRoundComplete()) {
            const winner = this._currentPlayerToAct === lastPlayer ? lastPlayer : null;
            this._onBettingRoundComplete(winner);
        }
        else
            this.startNextPlayerTurn();
    }
    doDefualtActionOnTimeout() {
        console.log('doDefualtActionOnTimeout ');
        const defaultAction = this._actionValidator
            .getValidActions(this._bettingState, this._currentPlayerToAct, this._biggestBetToCall)
            .includes('check')
            ? 'check'
            : 'fold';
        this.handlePlayerAction(this._currentPlayerToAct.getId(), defaultAction);
    }
    isBettingRoundComplete() {
        const activePlayers = Array.from(this._bettingState.potContributions.keys()).filter(player => player.isActive());
        // Round is complete if:
        // 1. Only one player remains (others folded or allin)
        // 2. action is back to the last aggresor (or first player to act in case there is no aggresion behind)
        return (activePlayers.length <= 1 ||
            this._currentPlayerToAct === this._roundEndsCondition);
    }
    switchToNextPlayer() {
        this._currentPlayerToAct = (0, PositionsUtils_1.findNextPlayerToAct)(this._currentPlayerToAct.getPosition(), this._game);
        this.updateBettingState({ playerToAct: this._currentPlayerToAct.getId() });
    }
    updateBettingState(partialUpdate) {
        this._bettingState = Object.assign(Object.assign({}, this._bettingState), partialUpdate);
    }
    broadcastBettingState() {
        this._game.updateGameStateAndBroadcast({ bettingState: this._bettingState }, null);
    }
    getCurrentPlayerToAct() {
        return this._currentPlayerToAct;
    }
}
exports.BettingManager = BettingManager;
//# sourceMappingURL=BettingManager.js.map