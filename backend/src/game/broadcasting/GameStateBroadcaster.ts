// src/game/broadcasting/GameStateBroadcaster.ts

import { Server } from 'socket.io';
import { Game } from '../Game';
import { GamePhase } from '../types/GameStateUtils';
import { PlayerInGame } from '../../player/PlayerInGame';
import { PlayerAction, BettingState } from '../betting/types';

interface Card {
  rank: string;
  suit: string;
}

interface DetailedGameState {
  // Game core state
  id: string;
  phase: GamePhase;
  stakes: string;

  // Cards state
  flops: Card[][]; // Array of 3 flops, each with 3 cards
  turns: Card[]; // Array of 3 turn cards
  rivers: Card[]; // Array of 3 river cards

  // Players state
  observers: {
    id: string;
    name: string;
    coins: number;
    remainingTimeCookies: number;
  }[];

  // Active players state
  playersInGame: {
    id: string;
    name: string;
    position: 'sb' | 'bb';
    currentStack: number;
    isFolded: boolean;
    cards?: Card[]; // 12 cards for Open Face Chinese poker
    remainingTimeCookies: number;
  }[];

  // Betting state
  potSize: number;
  bettingRound?: {
    currentBet: number;
    lastAction: PlayerAction | null;
    lastRaiseAmount: number;
    currentPlayerToAct: string | null;
    timeRemaining: number;
    timeCookiesUsedThisRound: number;
  };
}

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
        .map(player => ({
          id: player.id,
          name: player.name,
          position: player === sbPlayer ? 'sb' : 'bb',
          currentStack: player.currentStack,
          isFolded: player.getIsFolded(),
          remainingTimeCookies: player.remainingTimeCookies,
          // Only include cards for the viewing player
          ...(player.id === viewingPlayerId && { cards: player.cards }),
        })),

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
