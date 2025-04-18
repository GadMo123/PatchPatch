// src/game/broadcasting/GameStateBroadcaster.ts - Broadcasting GameState to all clients involved in a game.

import { Server } from "socket.io";
import { Game } from "../Game";
import {
  ArrangePlayerCardsStateClientData,
  BettingStateClientData,
  Card,
  GameStateServerBroadcast,
  PrivatePlayerClientData,
  PublicPlayerClientData,
  ShowdownResultClientData,
  SocketEvents,
  TableConfigClientData,
} from "@patchpatch/shared";
import {
  BettingState,
  getStakes,
  TableConfig,
} from "game/betting/BettingTypes";
import { ArrangePlayerCardsState } from "game/arrangeCards/ArrangePlayerCardsManager";
import { Player } from "player/Player";
import {
  PlayerInGame,
  PlayerPrivateState,
  PlayerPublicState,
} from "game/types/PlayerInGame";
import { GamePhase, ShowdownResult } from "../types/GameState";

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
        // Create a new object that includes baseState with privatePlayerData updated
        const playerSpecificState = {
          ...baseState,
          privatePlayerData: reducePlayerPrivateStateToClientData(
            player.getPlayerPrivateState()
          ),
        };

        this.broadcastStateToSocket(player.getSocketId(), playerSpecificState);
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
        tableAbsolutePosition: index,
      } as PublicPlayerClientData;
    }

    // expose player's private cards at showdown only
    const exposePrivateCards =
      game.getPhase() === GamePhase.Showdown && !player.isFolded();
    const playerPrivateCards = exposePrivateCards
      ? player.getPlayerPrivateState().cards
      : undefined;

    // For occupied seats, get the full public state and convert to client format
    return {
      ...reducePlayerPublicStateToClientData(
        player.getPlayerPublicState(),
        playerPrivateCards
      ),
      tableAbsolutePosition: index,
    } as PublicPlayerClientData;
  });

  const bettingState = game.getBettingState();
  const arrangePlayerCardsState = game.getArrangePlayerCardsState();
  const showdownState = game.getShowdownState();
  const tableConfig = game.getTableConfig();

  return {
    id: game.getId(),
    phase: game.getPhase(),
    stakes: getStakes(tableConfig.sbAmount, tableConfig.bbAmount),
    flops: game.getFlops(),
    turns: game.getTurns(),
    rivers: game.getRivers(),
    potSizes: game.getPotSizes(),
    observersNames: game.getObserversNames(),
    privatePlayerData: null,
    publicPlayerDataMapByTablePosition: publicPlayerByPositions,
    bettingState: bettingState
      ? reduceBettingStateToClientData(bettingState)
      : null,
    tableConfig: reduceTableConfigToClientData(tableConfig),
    arrangePlayerCardsState: arrangePlayerCardsState
      ? reduceArrangeCardsToClientData(arrangePlayerCardsState)
      : null,
    showdown: showdownState
      ? reduceShowdownInfoToClientData(
          showdownState,
          game.getTableConfig().showdownAnimationTime
        )
      : null,
    noShowdown: game.getNoShowdownState(),
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
      timePerAction: tableConfig.timePerAction,
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
      callAmount: bettingState.callAmount ?? 0,
      allInAmount: bettingState.allInAmount,
      activePlayerRoundPotContributions:
        bettingState.activePlayerRoundPotContributions,
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
    playerState: PlayerPublicState,
    playerCards?: Card[]
  ): PublicPlayerClientData {
    return {
      name: playerState.name,
      position: playerState.pokerPosition || undefined,
      stack: playerState.currentStack || 0,
      id: playerState.id,
      tableAbsolutePosition: playerState.tablePosition,
      roundPotContributions: playerState.roundPotContributions,
      cards: playerCards,
      removed: playerState.removed,
      sitoutTimer: playerState.sitoutTimer,
      isFolded: playerState.isFolded,
    };
  }
}

function reducePlayerPrivateStateToClientData(
  privateState: PlayerPrivateState
): PrivatePlayerClientData {
  return {
    cards: privateState.cards,
    remainingTimeCookies: privateState.remainingTimeCookies ?? 0,
  };
}

function reduceShowdownInfoToClientData(
  showdownResults: ShowdownResult,
  ShowdownAnimationTime: number
): ShowdownResultClientData {
  return {
    board: showdownResults.board,
    potAmount: showdownResults.potAmount,
    winners: Array.from(showdownResults.winners.entries()), // Convert Map to array
    playersHandRank: Array.from(showdownResults.playersHandRank.entries()).map(
      ([player, handStrength]) => [player.getId(), handStrength.category]
    ),
    animationTime: ShowdownAnimationTime,
  };
}
