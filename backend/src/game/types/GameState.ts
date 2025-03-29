//  Server side version of game state representation

import { PlayerInGame } from "./PlayerInGame";
import { TableConfig, BettingState } from "../betting/BettingTypes";
import { ArrangePlayerCardsState } from "../arrangeCards/ArrangePlayerCardsManager";
import { Card, NoShowdownResultClientData, Position } from "@patchpatch/shared";
import { Player } from "player/Player";
import { HandStrength } from "game/showdown/ShowdownManager";

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

export interface ShowdownResult {
  board: number; // 0, 1, or 2
  potAmount: number; // How much was in this portion of the pot
  winners: Map<string, number>; // Player IDs and their winnings
  playersHandRank: Map<PlayerInGame, HandStrength>; // Map player id to hand strength in the current board
}

export interface DetailedGameState {
  // Core state
  id: string;
  phase: GamePhase;

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

  // Winners (Id) and amounts won at the end of a poker hand
  potsWinners: Map<string, number> | null;

  // Betting state
  bettingState: BettingState | null;
  tableConfig: TableConfig;
  arrangePlayerCardsState: ArrangePlayerCardsState | null;

  showdownResults: ShowdownResult | null; // showdown results to broadcast
  noShowdownResults: NoShowdownResultClientData | null;
}
