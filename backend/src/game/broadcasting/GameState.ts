// src\game\broadcasting\GameState.ts - Prepare a GameState protocol representation to broadcast.

import { PlayerInGame } from "../types/PlayerInGame";
import { Game } from "../Game";
import { Player } from "../../player/Player";
import { TableConfig, BettingState } from "../betting/BettingTypes";
import { ArrangePlayerCardsState } from "../arrangeCards/ArrangePlayerCardsManager";
import { GameStateServerBroadcast } from "shared";
import { Position } from "shared";
import { Card } from "shared";

export enum GamePhase {
  Waiting = "waiting",
  PreflopBetting = "preflop-betting",
  ArrangePlayerCards = "arrange-player-cards",
  FlopBetting = "flop-betting",
  TurnBetting = "turn-betting",
  RiverBetting = "river-betting",
  Showdown = "showdown",
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
  playerInPosition: Map<Position, PlayerInGame | null>;

  // Betting state
  bettingState: BettingState | null;
  tableConfig: TableConfig;
  arrangePlayerCardsState: ArrangePlayerCardsState | null;
}

// Exclude private data from the game state to broadcast to everyone
export function getBaseGameState(game: Game): GameStateServerBroadcast {
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
    potSize: null,
    observers: game.getObserversNames(),
    publicPlayerDataMapByPosition: publicPlayerByPositions,
    privatePlayerData: null,
    bettingState: game.getBettingState(),
    tableConfig: game.getTableConfig(),
    arrangePlayerCardsState: game.getArrangePlayerCardsState(),
  };
}

// Add personalized private data for a specific player
export function addPlayerPersonalData(
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
