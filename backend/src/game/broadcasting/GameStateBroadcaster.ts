// src/game/broadcasting/GameStateBroadcaster.ts - Broadcasting GameState to all clients involved in a game.

import { Server } from "socket.io";
import { Game } from "../Game";
import {
  ArrangePlayerCardsStateClientData,
  BettingStateClientData,
  GameStateServerBroadcast,
  PublicPlayerClientData,
  SocketEvents,
  TableConfigClientData,
} from "@patchpatch/shared";
import { BettingState, TableConfig } from "game/betting/BettingTypes";
import { ArrangePlayerCardsState } from "game/arrangeCards/ArrangePlayerCardsManager";
import { Player } from "player/Player";
import { PlayerInGame, PlayerPublicState } from "game/types/PlayerInGame";

export class GameStateBroadcaster {
  private _cachedLastBaseState: GameStateServerBroadcast | null;

  // Even better solution - attach an Id to game state to mark the oldest state as the correct state for the client.

  constructor(private _io: Server) {
    this._cachedLastBaseState = null;
  }

  // Helper method to broadcast state to a specific socket
  private broadcastStateToSocket(
    socketId: string,
    gameState: GameStateServerBroadcast,
    playerPrivateState: any = null
  ) {
    try {
      const stateToSend = playerPrivateState
        ? {
            ...gameState,
            playerPrivateState,
          }
        : gameState;
      this._io.to(socketId).emit(SocketEvents.GAME_STATE_UPDATE, stateToSend);
    } catch (error) {
      console.error(`Error broadcasting to socket ${socketId}:`, error);
    }
  }

  broadcastGameState(game: Game, afterFunction: (() => void) | null) {
    const baseState = getBaseGameState(game);
    // Cache the latest base state
    this._cachedLastBaseState = baseState;

    // Broadcast to players in game
    game.getPlayersBySeat()?.forEach((player) => {
      if (player) {
        this.broadcastStateToSocket(
          player.getSocketId(),
          baseState,
          player.getPlayerPrivateState()
        );
      }
    });

    // Broadcast to observers
    game.getObserversSockets().forEach((observerSocket) => {
      if (observerSocket) {
        this.broadcastStateToSocket(observerSocket, baseState);
      }
    });

    // Call afterFunction with a small delay to allow players receive the state
    if (afterFunction) {
      setTimeout(afterFunction, 10);
    }
  }

  // Broadcast to a specific player or observer (upon request such as 'reconnection' event)
  async broadcastCachedState(
    recipient: PlayerInGame | Player
  ): Promise<boolean> {
    if (!this._cachedLastBaseState) {
      return false;
    }

    // If recipient is a PlayerInGame, get their socket ID and private state
    if (recipient.constructor.name === "PlayerInGame") {
      this.broadcastStateToSocket(
        recipient.getSocketId(),
        this._cachedLastBaseState,
        (recipient as PlayerInGame).getPlayerPrivateState()
      );
    } else {
      // Recipient is an observer socket ID
      this.broadcastStateToSocket(
        recipient.getSocketId(),
        this._cachedLastBaseState
      );
    }
    return true;
  }
}

// Exclude private data from the game state to broadcast to everyone
function getBaseGameState(game: Game): GameStateServerBroadcast {
  const seatMap = game.getPlayersBySeat();

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

  function reduceTableConfigToClientData(
    tableConfig: TableConfig
  ): TableConfigClientData {
    return {
      maxPlayers: tableConfig.maxPlayers as 2 | 3 | 6,
      minBuyin: tableConfig.minBuyin,
      maxBuyin: tableConfig.maxBuyin,
      bigBlindAmount: tableConfig.bbAmount,
      smallBlindAmount: tableConfig.sbAmount,
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
      name: playerState.name,
      position: playerState.pokerPosition || undefined,
      stack: playerState.currentStack || 0,
      id: playerState.id,
      tableAbsolotePosition: playerState.tablePosition,
    };
  }
}
