"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSessionToken = exports.getGameAndPlayer = exports.isBuyIntoGamePayload = exports.isJoinGamePayload = exports.isCardArrangementPayload = exports.isPlayerActionPayload = exports.isLoginPayload = void 0;
const shared_1 = require("shared");
const ServerStateManager_1 = require("../ServerStateManager");
const validPlayerActions = new Set([
    "fold",
    "check",
    "call",
    "bet",
    "raise",
]);
// Type guards for runtime validation
const isLoginPayload = (payload) => {
    if (typeof payload !== "object" || payload === null)
        return false;
    const p = payload;
    return typeof p.name === "string" && p.name.length > 0;
};
exports.isLoginPayload = isLoginPayload;
const isInGamePayload = (p) => {
    return typeof p.gameId === "string" && typeof p.playerId === "string";
};
const isPlayerActionPayload = (payload) => {
    if (typeof payload !== "object" || payload === null)
        return false;
    const p = payload;
    return (isInGamePayload(p) &&
        typeof p.action === "string" &&
        validPlayerActions.has(p.action) &&
        (p.amount === undefined || (typeof p.amount === "number" && p.amount >= 0)));
};
exports.isPlayerActionPayload = isPlayerActionPayload;
const isCardArrangementPayload = (payload) => {
    if (typeof payload !== "object" || payload === null)
        return false;
    const p = payload;
    const isValidArrangement = Array.isArray(p.arrangement) &&
        p.arrangement.length === 12 &&
        p.arrangement.every((item) => item instanceof shared_1.Card && (0, shared_1.isValidSuit)(item.suit) && (0, shared_1.isValidRank)(item.rank));
    return isInGamePayload(p) && isValidArrangement;
};
exports.isCardArrangementPayload = isCardArrangementPayload;
const isJoinGamePayload = (payload) => {
    if (typeof payload !== "object" || payload === null)
        return false;
    const p = payload;
    return isInGamePayload(p) && typeof p.position === "string";
};
exports.isJoinGamePayload = isJoinGamePayload;
const isBuyIntoGamePayload = (payload) => {
    if (typeof payload !== "object" || payload === null)
        return false;
    const p = payload;
    return isInGamePayload(p) && typeof p.amount === "number";
};
exports.isBuyIntoGamePayload = isBuyIntoGamePayload;
// could be async if need acurate state at some point
const getGameAndPlayer = (payload) => {
    var _a, _b;
    const game = (_a = ServerStateManager_1.ServerStateManager.getInstance().getGame(payload.gameId)) !== null && _a !== void 0 ? _a : null;
    const player = (_b = ServerStateManager_1.ServerStateManager.getInstance().getPlayer(payload.playerId)) !== null && _b !== void 0 ? _b : null;
    return { game: game, player: player };
};
exports.getGameAndPlayer = getGameAndPlayer;
const validateSessionToken = (token) => {
    return typeof token === "string" && token.length > 20 && token.length < 500;
};
exports.validateSessionToken = validateSessionToken;
//# sourceMappingURL=EventsInputValidator.js.map