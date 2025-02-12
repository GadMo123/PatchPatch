// src/game/broadcasting/GameStateBroadcaster.ts - Broadcasting GameState to all clients involved in a game.

import { Server } from "socket.io";
import { Game } from "../Game";
import {
  ArrangePlayerCardsStateClientData,
  BettingStateClientData,
  GameStateServerBroadcast,
  Position,
  PublicPlayerClientData,
  SocketEvents,
  TableConfigClientData,
} from "@patchpatch/shared";
import { BettingState, TableConfig } from "game/betting/BettingTypes";
import { ArrangePlayerCardsState } from "game/arrangeCards/ArrangePlayerCardsManager";
import { PlayerPublicState } from "game/types/PlayerInGame";

export class GameStateBroadcaster {
  constructor(private _io: Server) {}

  broadcastGameState(game: Game, afterFunction: (() => void) | null) {
    const baseState = getBaseGameState(game);

    // Broadcast to players in game
    game.getPlayersInGame()?.forEach((player, position) => {
      if (player) {
        const playerGameState = {
          ...baseState,
          playerPrivateState: player.getPlayerPrivateState(),
        };
        try {
          this._io
            .to(player.getSocketId())
            .emit(SocketEvents.GAME_STATE_UPDATE, playerGameState);
        } catch (error) {
          console.error(
            `Error broadcasting to player ${player.getSocketId()}:`,
            error
          );
        }
      }
    });

    // Broadcast to observers
    game.getObserversSockets().forEach((observer) => {
      if (observer)
        try {
          this._io.to(observer).emit(SocketEvents.GAME_STATE_UPDATE, baseState);
        } catch (error) {
          console.error(`Error broadcasting to observer ${observer}:`, error);
        }
    });

    // Call afterFunction with a small delay to allow players recive the state
    if (afterFunction) {
      setTimeout(() => {
        afterFunction();
      }, 10);
    }
  }
}

// Exclude private data from the game state to broadcast to everyone
function getBaseGameState(game: Game): GameStateServerBroadcast {
  const seatMap = game.getSeatMap();

  // Map each player to their public state for broadcasting
  const publicPlayerByPositions = seatMap.map((player, index) => {
    if (player === null) {
      // For empty seats, return minimal data with just the position
      return {
        tableAbsolotePosition: index,
      } as PublicPlayerClientData;
    }

    // For occupied seats, get the full public state and convert to client format
    return {
      ...reducePlayerPublicStateToClientData(player.getPlayerPublicState()),
      tableAbsolotePosition: index,
    } as PublicPlayerClientData;
  });

  const bettingState = game.getBettingState();
  const arrangePlayerCardsState = game.getArrangePlayerCardsState();

  return {
    id: game.getId(),
    phase: game.getPhase(),
    stakes: game.getStakes(),
    flops: game.getFlops(),
    turns: game.getTurns(),
    rivers: game.getRivers(),
    potSize: game.getPotSize(),
    observersNames: game.getObserversNames(),
    privatePlayerData: null,
    publicPlayerDataMapByTablePosition: publicPlayerByPositions,
    bettingState: bettingState
      ? reduceBettingStateToClientData(bettingState)
      : null,
    tableConfig: reduceTableConfigToClientData(game.getTableConfig()),
    arrangePlayerCardsState: arrangePlayerCardsState
      ? reduceArrangeCardsToClientData(arrangePlayerCardsState)
      : null,
  };
}

// Add personalized private data for a specific player
function addPlayerPersonalData(
  baseState: Object,
  playerPosition: Position,
  game: Game
): Object {
  const personalizedState = structuredClone(baseState) as any; // Clone the base state

  // Add private player data if the player exists in the game
  const player = game.getPlayerInPosition(playerPosition);

  if (player) {
    // Update the map to include both public and private data for this player
    personalizedState.privatePlayerData = player.getPlayerPrivateState();
  }

  return personalizedState;
}

function reduceTableConfigToClientData(
  tableConfig: TableConfig
): TableConfigClientData {
  return {
    maxPlayers: tableConfig.maxPlayers as 2 | 3 | 6,
    minBuyin: tableConfig.minBuyin,
    maxBuyin: tableConfig.maxBuyin,
  };
}

function reduceBettingStateToClientData(
  bettingState: BettingState
): BettingStateClientData {
  return {
    timeRemaining: bettingState.timeRemaining,
    timeCookiesUsedThisRound: bettingState.timeCookiesUsedThisRound,
    playerToAct: bettingState.playerToAct,
    playerValidActions: bettingState.playerValidActions,
    minRaiseAmount: bettingState.minRaiseAmount,
  };
}

function reduceArrangeCardsToClientData(
  arrangeCardsState: ArrangePlayerCardsState
): ArrangePlayerCardsStateClientData {
  return {
    playerDoneMap: arrangeCardsState.playerDoneMap,
    timeRemaining: arrangeCardsState.timeRemaining,
  };
}

function reducePlayerPublicStateToClientData(
  playerState: PlayerPublicState
): PublicPlayerClientData {
  return {
    tableAbsolotePosition: playerState.tablePosition,
  };
}
