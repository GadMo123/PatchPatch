export var Position;
(function (Position) {
    Position["BB"] = "bb";
    Position["SB"] = "sb";
    Position["BTN"] = "btn";
    Position["CO"] = "co";
    Position["MP"] = "mp";
    Position["UTG"] = "utg";
})(Position || (Position = {}));
export var BettingTypes;
(function (BettingTypes) {
    BettingTypes["BET"] = "bet";
    BettingTypes["CHECK"] = "check";
    BettingTypes["CALL"] = "call";
    BettingTypes["FOLD"] = "fold";
    BettingTypes["RAISE"] = "raise";
})(BettingTypes || (BettingTypes = {}));
export var GameType;
(function (GameType) {
    GameType["Patch_Patch"] = "Patch-Patch";
    GameType["HOLDEM"] = "Holdem";
    GameType["OMAHA"] = "Omaha";
})(GameType || (GameType = {}));
export var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "Waiting";
    GameStatus["RUNNING"] = "Running";
})(GameStatus || (GameStatus = {}));
export var GameSpeed;
(function (GameSpeed) {
    GameSpeed["FAST"] = "fast";
    GameSpeed["MID"] = "mid";
    GameSpeed["SLOW"] = "slow";
})(GameSpeed || (GameSpeed = {}));
