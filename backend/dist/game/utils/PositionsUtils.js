"use strict";
// src\game\utils\PositionsUtils.ts - Helper functions related to position, manage players position and table rotations between hands.
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFirstPlayerToAct = findFirstPlayerToAct;
exports.findNextPlayerToAct = findNextPlayerToAct;
exports.getPosition = getPosition;
exports.rotatePositionsAndSetupPlayerState = rotatePositionsAndSetupPlayerState;
const shared_1 = require("shared");
const GameState_1 = require("../broadcasting/GameState");
const positionOrder = [
    shared_1.Position.UTG,
    shared_1.Position.MP,
    shared_1.Position.CO,
    shared_1.Position.BTN,
    shared_1.Position.SB,
    shared_1.Position.BB,
];
function findFirstPlayerToAct(game) {
    const nextToTalk = game.getPhase() === GameState_1.GamePhase.PreflopBetting ? shared_1.Position.UTG : shared_1.Position.SB;
    return (game.getPlayerInPosition(nextToTalk) ||
        findNextPlayerToAct(nextToTalk, game));
}
function findNextPlayerToAct(startingPosition, game) {
    const startIndex = positionOrder.indexOf(startingPosition);
    for (let i = 1; i < positionOrder.length; i++) {
        const nextIndex = (startIndex + i) % positionOrder.length;
        const position = positionOrder[nextIndex];
        const player = game.getPlayerInPosition(position);
        if (player === null || player === void 0 ? void 0 : player.isActive()) {
            return player;
        }
    }
    throw new Error("No players found to act.");
}
function getPosition(position) {
    const positions = Object.values(shared_1.Position);
    const foundPosition = positions.find((p) => p === position);
    return foundPosition !== null && foundPosition !== void 0 ? foundPosition : null;
}
function rotatePositionsAndSetupPlayerState(players, state) {
    const readyPlayers = [];
    players.forEach((player, position) => {
        if (player === null || player === void 0 ? void 0 : player.isReadyToStartHand(state.tableConfig.bbAmount)) {
            readyPlayers.push({ player, position });
            player.updatePlayerPublicState({ isFolded: false, isAllIn: false });
        }
    });
    if (readyPlayers.length < 2) {
        return false;
    }
    players.forEach((_, position) => {
        players.set(position, null);
    });
    const priorityOrder = [
        shared_1.Position.BB,
        shared_1.Position.SB,
        shared_1.Position.BTN,
        shared_1.Position.CO,
        shared_1.Position.MP,
        shared_1.Position.UTG,
    ];
    const playerToMoveFront = priorityOrder.reduce((found, position) => found || readyPlayers.find((p) => p.position === position), undefined);
    if (!playerToMoveFront) {
        return false;
    }
    const activePositions = positionOrder.slice(-readyPlayers.length);
    players.set(activePositions[0], playerToMoveFront.player);
    const remainingPlayers = readyPlayers.filter((p) => p.player !== playerToMoveFront.player);
    remainingPlayers.forEach(({ player }, index) => {
        const positionIndex = index + 1;
        if (positionIndex < activePositions.length) {
            players.set(activePositions[positionIndex], player);
        }
    });
    return true;
}
//# sourceMappingURL=PositionsUtils.js.map