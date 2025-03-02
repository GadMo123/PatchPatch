// src\game\broadcasting\GameState.ts - Server side version of game state representation

import { PlayerInGame } from "../types/PlayerInGame";
import { TableConfig, BettingState } from "../betting/BettingTypes";
import { ArrangePlayerCardsState } from "../arrangeCards/ArrangePlayerCardsManager";
import { Card, Position } from "@patchpatch/shared";
import { Player } from "player/Player";

export enum GamePhase {
  Waiting = "waiting", // waiting for ready players to join next hand
  PreflopBetting = "preflop-betting",
  ArrangePlayerCards = "arrange-player-cards",
  FlopBetting = "flop-betting",
  TurnBetting = "turn-betting",
  RiverBetting = "river-betting",
  Showdown = "showdown",
  StartingHand = "StartingHand",
  DealPreflop = "dealPreflop",
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
  observers: Set<Player>;

  // Map of players playing by poker position
  playerInPosition: Map<Position, PlayerInGame | null>;

  // Map of players sitting in by table position
  playersAbsolutePosition: Array<PlayerInGame | null>;

  // Betting state
  bettingState: BettingState | null;
  tableConfig: TableConfig;
  arrangePlayerCardsState: ArrangePlayerCardsState | null;
}
