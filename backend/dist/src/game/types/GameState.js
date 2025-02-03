"use strict";
// src/utils/GameStateUtils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateUtils = exports.GamePhase = void 0;
var GamePhase;
(function (GamePhase) {
    GamePhase["Waiting"] = "waiting";
    GamePhase["PreflopBetting"] = "preflop-betting";
    GamePhase["ArrangePlayerCards"] = "arrange-player-cards";
    GamePhase["FlopBetting"] = "flop-betting";
    GamePhase["TurnBetting"] = "turn-betting";
    GamePhase["RiverBetting"] = "river-betting";
    GamePhase["Showdown"] = "showdown";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
class GameStateUtils {
    // Exclude private data from the game state to broadcast to everyone
    static getBaseGameState(game) {
        const playerInPosition = game.getPlayersInGame();
        // Map each player to their public state for broadcasting
        const publicPlayerByPositions = playerInPosition
            ? new Map(Array.from(playerInPosition.entries()).map(([position, player]) => [
                position,
                player ? player.getPlayerPublicState() : null,
            ]))
            : null;
        return {
            id: game.getId(),
            phase: game.getPhase(),
            stakes: game.getStakes(),
            flops: game.getFlops(),
            turns: game.getTurns(),
            rivers: game.getRivers(),
            potSize: game.getPotSize(),
            observers: game.getObserversNames(),
            publicPlayerDataMapByPosition: publicPlayerByPositions,
            privatePlayerData: null,
            bettingState: game.getBettingState(),
            bettingConfig: game.getBettingConfig(),
            arrangePlayerCardsState: game.getArrangePlayerCardsState(),
        };
    }
    // Add personalized private data for a specific player
    static addPlayerPersonalData(baseState, playerPosition, game) {
        const personalizedState = structuredClone(baseState); // Clone the base state
        // Add private player data if the player exists in the game
        const player = game.getPlayerInPosition(playerPosition);
        if (player) {
            // Update the map to include both public and private data for this player
            personalizedState.privatePlayerData = player.getPlayerPrivateState();
        }
        return personalizedState;
    }
}
exports.GameStateUtils = GameStateUtils;
//# sourceMappingURL=GameState.js.map