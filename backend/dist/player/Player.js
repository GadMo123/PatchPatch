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
exports.Player = void 0;
// Player.ts - A representation of a logged in player.
const async_mutex_1 = require("async-mutex");
class Player {
    constructor(_id, _name, _socketId) {
        this._id = _id;
        this._name = _name;
        this._socketId = _socketId;
        this.activeGamesLock = new async_mutex_1.Mutex();
        this.remainingTimeCookies = 1;
        this.bankCoins = 10000000;
        this.activeGames = new Set();
        this.bankLock = new async_mutex_1.Mutex();
        this.activeGamesLock = new async_mutex_1.Mutex();
        this.timebankCookiesLock = new async_mutex_1.Mutex();
    }
    getId() {
        return this._id;
    }
    getName() {
        return this._name;
    }
    getSocketId() {
        return this._socketId;
    }
    buyIntoGame(amount, game) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.bankLock.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                const playerInGame = game.getPlayer(this._id);
                if (!playerInGame || this.bankCoins < amount)
                    return false;
                this.bankCoins -= amount;
                return true;
            }));
        });
    }
    addToBankCoins(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bankLock.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                this.bankCoins += amount;
            }));
        });
    }
    getTimebankCookies() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.remainingTimeCookies;
        });
    }
    useTimebankCookie() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.timebankCookiesLock.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                if (this.remainingTimeCookies <= 0)
                    return false;
                this.remainingTimeCookies -= 1;
                return true;
            }));
        });
    }
    addActiveGame(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.activeGamesLock.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                this.activeGames.add(gameId);
            }));
        });
    }
    removeActiveGame(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.activeGamesLock.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                this.activeGames.delete(gameId);
            }));
        });
    }
    isInGame(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.activeGamesLock.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                return this.activeGames.has(gameId);
            }));
        });
    }
    getActiveGamesId() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.activeGamesLock.runExclusive(() => __awaiter(this, void 0, void 0, function* () {
                return this.activeGames;
            }));
        });
    }
}
exports.Player = Player;
//# sourceMappingURL=Player.js.map