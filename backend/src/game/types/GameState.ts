// src/utils/GameStateUtils.ts

import { PlayerInGame, PlayerPublicState } from './PlayerInGame';
import { BettingConfig, BettingState, PlayerAction } from '../betting/types';
import { Card } from './Card';
import { Position } from './Positions';
import { Game } from '../Game';
import { Player } from '../../player/Player';

export enum GamePhase {
  Waiting = 'waiting',
  Started = 'started',
  DealCards = 'deal-cards',
  PreflopBetting = 'preflop-betting',
  FlopDealt = 'flop-dealt',
  ArrangePlayerCards = 'arrange-player-cards',
  FlopBetting = 'flop-betting',
  TurnDealt = 'turn-dealt',
  TurnBetting = 'turn-betting',
  RiverDealt = 'river-dealt',
  RiverBetting = 'river-betting',
  Showdown = 'showdown',
}

export interface DetailedGameState {
  // Core state
  id: string;
  phase: GamePhase;
  stakes: string;
  potSize: number;

  // Cards state
  flops: Card[][]; // Array of 3 flops, each with 3 cards
  turns: Card[]; // Array of 3 turn cards
  rivers: Card[]; // Array of 3 river cards

  // Observers list
  observers: Player[];

  // Map of players playing by position
  playerInPosition: Map<Position, PlayerInGame | null> | null;

  // Betting state
  bettingState: BettingState | null;
  bettingConfig: BettingConfig;
}

export class GameStateUtils {
  // Exclude private data from the game state to broadcast to everyone
  static getBaseGameState(game: Game): Object {
    const playerInPosition = game.getPlayersInGame();

    // Map each player to their public state for broadcasting
    const publicPlayerByPositions = playerInPosition
      ? new Map(
          Array.from(playerInPosition.entries()).map(([position, player]) => [
            position,
            player ? player.getPlayerPublicState() : null,
          ])
        )
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
      bettingCongig: game.getBettingConfig(),
    };
  }

  // Add personalized private data for a specific player
  static addPlayerPersonalData(
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
}
