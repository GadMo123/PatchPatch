"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSpeed = exports.GameStatus = exports.GameType = exports.BettingTypes = exports.Position = void 0;
var Position;
(function (Position) {
    Position["BB"] = "bb";
    Position["SB"] = "sb";
    Position["BTN"] = "btn";
    Position["CO"] = "co";
    Position["MP"] = "mp";
    Position["UTG"] = "utg";
})(Position = exports.Position || (exports.Position = {}));
var BettingTypes;
(function (BettingTypes) {
    BettingTypes["BET"] = "bet";
    BettingTypes["CHECK"] = "check";
    BettingTypes["CALL"] = "call";
    BettingTypes["FOLD"] = "fold";
    BettingTypes["RAISE"] = "raise";
})(BettingTypes = exports.BettingTypes || (exports.BettingTypes = {}));
var GameType;
(function (GameType) {
    GameType["Patch_Patch"] = "Patch-Patch";
    GameType["HOLDEM"] = "Holdem";
    GameType["OMAHA"] = "Omaha";
})(GameType = exports.GameType || (exports.GameType = {}));
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "Waiting";
    GameStatus["RUNNING"] = "Running";
})(GameStatus = exports.GameStatus || (exports.GameStatus = {}));
var GameSpeed;
(function (GameSpeed) {
    GameSpeed["FAST"] = "fast";
    GameSpeed["MID"] = "mid";
    GameSpeed["SLOW"] = "slow";
})(GameSpeed = exports.GameSpeed || (exports.GameSpeed = {}));
