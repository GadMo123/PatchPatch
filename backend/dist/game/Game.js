"use strict";
// src/game/Game.ts
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
exports.Game = void 0;
const GameState_1 = require("./broadcasting/GameState");
const PlayerInGame_1 = require("./types/PlayerInGame");
const GameStateBroadcaster_1 = require("./broadcasting/GameStateBroadcaster");
const PositionsUtils_1 = require("./utils/PositionsUtils");
const Deck_1 = require("./types/Deck");
const SingleGameFlowManager_1 = require("./utils/SingleGameFlowManager");
const async_mutex_1 = require("async-mutex");
class Game {
    constructor(id, stakes, _server, tableConfig) {
        this._server = _server;
        this._server = _server;
        this._broadcaster = new GameStateBroadcaster_1.GameStateBroadcaster(_server);
        this._TableConditionChangeMutex = new async_mutex_1.Mutex();
        this._handWonWithoutShowdown = false;
        this._state = {
            id,
            stakes,
            phase: GameState_1.GamePhase.Waiting,
            flops: [],
            turns: [],
            rivers: [],
            observers: [],
            potSize: 0,
            playerInPosition: new Map(),
            tableConfig: tableConfig,
            bettingState: null,
            arrangePlayerCardsState: null,
        };
        this._deck = null;
        this._gameFlowManager = null;
        this._stacksUpdatesForNextHand = new Array();
    }
    /*
    return true if ready to start next hand
     false if not, and keep waiting state until recived new active player (join/rebuy/marked-ready)
    */
    PrepareNextHand() {
        this._handWonWithoutShowdown = false;
        this._state = Object.assign(Object.assign({}, this._state), { phase: GameState_1.GamePhase.Waiting, flops: [], turns: [], rivers: [], potSize: 0 });
        this._TableConditionChangeMutex.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
            (0, PositionsUtils_1.rotatePositionsAndSetupPlayerState)(this._state.playerInPosition, this._state);
            this._stacksUpdatesForNextHand.forEach(([player, amount]) => {
                player.updatePlayerPublicState({
                    currentStack: player.getStack() + amount,
                });
                player.isReadyToStartHand;
            });
        }));
    }
    dealNewHand() {
        this._deck = new Deck_1.Deck();
        this._state.phase = GameState_1.GamePhase.PreflopBetting;
        this._state.playerInPosition.forEach((player) => {
            // As for now, player can only play a hand with >= 1BB stack
            if (player === null || player === void 0 ? void 0 : player.isActive()) {
                player.updatePlayerPrivateState({
                    cards: this._deck.getPlayerCards(),
                }); // update
            }
        });
    }
    updateGameStateAndBroadcast(updates, afterFunction) {
        if (updates)
            this._state = Object.assign(Object.assign({}, this._state), updates);
        this._broadcaster.broadcastGameState(this, afterFunction);
    }
    startGame() {
        return __awaiter(this, void 0, void 0, function* () {
            this._TableConditionChangeMutex.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                if (this._gameFlowManager)
                    return;
                this._gameFlowManager = new SingleGameFlowManager_1.SingleGameFlowManager(this);
                setImmediate(() => { var _a; return (_a = this._gameFlowManager) === null || _a === void 0 ? void 0 : _a.startNextStreet(); });
            }));
        });
    }
    addObserver(player) {
        this._TableConditionChangeMutex.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
            if (!this._state.observers.some((observer) => observer === player)) {
                this._state.observers.push(player); // broadcast?
            }
        }));
    }
    addPlayer(player, position) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._TableConditionChangeMutex.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                // Check if the position is available
                if (this._state.playerInPosition.has(position) ||
                    this._state.playerInPosition.get(position) != null)
                    return false;
                const playerInGame = new PlayerInGame_1.PlayerInGame(player, this, position);
                this._state.playerInPosition.set(position, playerInGame);
                //Remove player as an observers
                this._state.observers = this._state.observers.filter((obs) => obs.getId() !== player.getId());
                setImmediate(() => this.updateGameStateAndBroadcast({}, null));
                return true;
            }));
        });
    }
    playerBuyIn(player, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            this._TableConditionChangeMutex.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                // if in a running game - set an even for the end of the current hand to add players chips
                if (this._gameFlowManager) {
                    this._stacksUpdatesForNextHand.push([player, amount]);
                }
                else {
                    // otherwise, add the buyin chips right away
                    player.updatePlayerPublicState({
                        currentStack: player.getStack() + amount,
                    });
                    const afterFunction = this.isReadyForNextHand()
                        ? this.startGame.bind(this) // start game if ready, the updated stack will be broadcasted in the first game broadcast.
                        : this.updateGameStateAndBroadcast.bind(this, {}, null); // otherwise update players with the buyin chips.
                    setImmediate(afterFunction);
                }
            }));
        });
    }
    dealRivers() {
        return this._deck.getRivers();
    }
    dealTurns() {
        return this._deck.getTurns();
    }
    dealFlops() {
        return this._deck.getFlops();
    }
    getStatus() {
        return this._state.phase;
    }
    getId() {
        return this._state.id;
    }
    getStakes() {
        return this._state.stakes;
    }
    getObserversNames() {
        return this._state.observers.map((observer) => observer.getName());
    }
    getPlayerInPosition(position) {
        var _a;
        return ((_a = this._state.playerInPosition) === null || _a === void 0 ? void 0 : _a.get(position)) || null;
    }
    getPlayersInGame() {
        return this._state.playerInPosition;
    }
    getPotSize() {
        return this._state.potSize;
    }
    getPhase() {
        var _a;
        return (_a = this._state) === null || _a === void 0 ? void 0 : _a.phase;
    }
    getFlops() {
        return this._state.flops;
    }
    getTurns() {
        return this._state.turns;
    }
    getRivers() {
        return this._state.rivers;
    }
    getTableConfig() {
        return this._state.tableConfig;
    }
    getBettingState() {
        return this._state.bettingState;
    }
    getObserversList() {
        return this._state.observers;
    }
    handleHandWonWithoutShowdown(winner) {
        this._handWonWithoutShowdown = true;
        winner.updatePlayerPublicState({
            currentStack: winner.getStack() + this._state.potSize,
        });
        this._state.potSize = 0;
        //todo update stacks, pot, ect
    }
    isHandWonWithoutShowdown() {
        return this._handWonWithoutShowdown;
    }
    getArrangePlayerCardsState() {
        return this._state.arrangePlayerCardsState;
    }
    doShowdown() {
        this._state.phase = GameState_1.GamePhase.Showdown;
        //todo
    }
    getServer() {
        return this._server;
    }
    getGameFlowManager() {
        return this._gameFlowManager;
    }
    isReadyForNextHand() {
        const minStackRequired = this._state.tableConfig.bbAmount *
            (Number(process.env.MIN_BB_TO_PLAY_HAND) || 1);
        const activePlayers = Array.from(this._state.playerInPosition.values()).filter((player) => player === null || player === void 0 ? void 0 : player.isReadyToStartHand(minStackRequired)).length;
        return activePlayers >= this._state.tableConfig.minPlayers;
    }
    getPlayer(playerId) {
        var _a;
        for (const [, player] of (_a = this._state.playerInPosition) !== null && _a !== void 0 ? _a : []) {
            if ((player === null || player === void 0 ? void 0 : player.getId()) === playerId)
                return player;
        }
        return null;
    }
}
exports.Game = Game;
//# sourceMappingURL=Game.js.map