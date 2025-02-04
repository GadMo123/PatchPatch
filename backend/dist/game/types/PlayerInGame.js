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
exports.PlayerInGame = void 0;
// extends player? seems right but have a synchronicity complexity
class PlayerInGame {
    // Player sits in game
    constructor(_player, _game, position) {
        this._player = _player;
        this._game = _game;
        this._player = _player;
        // Initialize states
        this._playerPublicState = {
            isSittingOut: true,
            id: _player.getId(),
            name: _player.getName(),
            position: position,
            currentStack: 0,
            isFolded: false,
            isAllIn: false,
        };
        this._player.addActiveGame(_game.getId());
        this._playerPrivateState = {
            cards: null,
            remainingTimeCookies: 0,
        };
        _player.getTimebankCookies().then((timebanks) => {
            this._playerPrivateState.remainingTimeCookies = timebanks;
        });
    }
    buyIntoGame(game, buyIn) {
        return __awaiter(this, void 0, void 0, function* () {
            const seccuss = yield this._player.buyIntoGame(buyIn, game);
            if (!seccuss)
                return false;
            this._playerPublicState.currentStack += buyIn;
            return true;
        });
    }
    cashoutStack() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentStack = this._playerPublicState.currentStack;
            if (currentStack > 0) {
                this._player.addToBankCoins(currentStack).then(() => this.updatePlayerPublicState({
                    currentStack: 0,
                    isAllIn: false,
                }));
            }
        });
    }
    exitGame() {
        this._player.removeActiveGame(this._game.getId());
    }
    useTimebankCookie() {
        return __awaiter(this, void 0, void 0, function* () {
            const success = yield this._player.useTimebankCookie();
            if (success) {
                const remainingCookies = yield this._player.getTimebankCookies();
                this.updatePlayerPrivateState({
                    remainingTimeCookies: remainingCookies,
                });
            }
            return success;
        });
    }
    getPlayerPublicState() {
        return this._playerPublicState;
    }
    updatePlayerPublicState(updates) {
        this._playerPublicState = Object.assign(Object.assign({}, this._playerPublicState), updates);
    }
    getPlayerPrivateState() {
        return this._playerPrivateState;
    }
    updatePlayerPrivateState(updates) {
        this._playerPrivateState = Object.assign(Object.assign({}, this._playerPrivateState), updates);
    }
    isFolded() {
        return this._playerPublicState.isFolded;
    }
    isReadyToStartHand(bbAmount) {
        const minStack = Number(process.env.MIN_BB_TO_PLAY_HAND) || 1;
        return (this._playerPublicState.currentStack >= bbAmount &&
            !this._playerPublicState.isSittingOut);
    }
    isActive() {
        return (!this._playerPublicState.isAllIn &&
            !this._playerPublicState.isFolded &&
            !this._playerPublicState.isSittingOut);
    }
    getStack() {
        return this._playerPublicState.currentStack;
    }
    getPosition() {
        return this._playerPublicState.position;
    }
    getId() {
        return this._player.getId();
    }
    getName() {
        return this._player.getName();
    }
    getSocketId() {
        return this._player.getSocketId();
    }
}
exports.PlayerInGame = PlayerInGame;
//# sourceMappingURL=PlayerInGame.js.map