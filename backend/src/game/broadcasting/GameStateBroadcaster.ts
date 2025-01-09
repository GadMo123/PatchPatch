// src/game/broadcasting/GameStateBroadcaster.ts

import { Server } from 'socket.io';
import { Game } from '../Game';
import { PlayerInGame, PlayerState } from '../../player/PlayerInGame';
import { BettingState } from '../betting/types';
import { DetailedGameState } from '../types/GameState';

export class GameStateBroadcaster {
  constructor(private io: Server) {}

  broadcastGameState(
    game: Game,
    currentPlayerToAct?: PlayerInGame,
    bettingState?: BettingState,
    timeRemaining?: number
  ) {
    // Broadcast to players in game
    [game.getSmallBlindPlayer(), game.getBigBlindPlayer()].forEach(player => {
      if (player) {
        const gameState = this.getDetailedGameState(game, player.id, {
          currentPlayerToAct,
          bettingState,
          timeRemaining,
        });
        this.io.to(player.socketId).emit('game-state', gameState);
      }
    });

    // Broadcast to observers (with hidden cards)
    const observerGameState = this.getDetailedGameState(game, null, {
      currentPlayerToAct,
      bettingState,
      timeRemaining,
    });
    game.getObserversList().forEach(observer => {
      this.io.to(observer.socketId).emit('game-state', observerGameState);
    });
  }

  private getDetailedGameState(
    game: Game,
    viewingPlayerId: string | null,
    options: {
      currentPlayerToAct?: PlayerInGame;
      bettingState?: BettingState;
      timeRemaining?: number;
    }
  ): DetailedGameState {
    const { currentPlayerToAct, bettingState, timeRemaining } = options;
    const sbPlayer = game.getSmallBlindPlayer();
    const bbPlayer = game.getBigBlindPlayer();

    const state: DetailedGameState = {
      id: game.getId(),
      phase: game.getPhase(),
      stakes: game.getStakes(),

      // Card information based on game phase
      flops: game.getFlops() || [],
      turns: game.getTurns() || [],
      rivers: game.getRivers() || [],

      // Observers list
      observers: game.getObserversList().map(player => ({
        id: player.id,
        name: player.name,
        coins: player.coins,
        remainingTimeCookies: player.remainingTimeCookies,
      })),

      // Active players in game
      playersInGame: [sbPlayer, bbPlayer]
        .filter((player): player is PlayerInGame => player !== null)
        .map(player => {
          //Public player's data
          const basePlayerState: Partial<PlayerState> = {
            id: player.playerState.id,
            name: player.playerState.name,
            position: player === sbPlayer ? 'sb' : 'bb',
            currentStack: player.playerState.currentStack,
            isFolded: player.playerState.isFolded,
          };

          // Only include private data for the viewing player
          if (player.playerState.id === viewingPlayerId) {
            return {
              ...basePlayerState,
              cards: player.playerState.cards,
              arrangedCards: player.playerState.arrangedCards,
              remainingTimeCookies: player.playerState.remainingTimeCookies,
            };
          }

          return basePlayerState;
        }) as PlayerState[],

      potSize: game.getPotSize(),
    };

    // Add betting state if available
    if (bettingState && currentPlayerToAct) {
      state.bettingRound = {
        currentBet: bettingState.currentBet,
        lastAction: bettingState.lastAction,
        lastRaiseAmount: bettingState.lastRaiseAmount,
        currentPlayerToAct: currentPlayerToAct.id,
        timeRemaining: timeRemaining || 0,
        timeCookiesUsedThisRound: bettingState.timeCookiesUsedThisRound,
      };
    }

    return state;
  }
}
