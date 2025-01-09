// src/utils/GameStateUtils.ts

import { PlayerInGame } from '../../player/PlayerInGame';
import { PlayerAction } from '../betting/types';
import { Card } from './Card';

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

  // Cards state
  flops: Card[][]; // Array of 3 flops, each with 3 cards
  turns: Card[]; // Array of 3 turn cards
  rivers: Card[]; // Array of 3 river cards

  // Players state
  observers: {
    id: string;
    name: string;
  }[];

  sbPlayer: PlayerInGame | null;
  bbPlayer: PlayerInGame | null;

  // Betting state
  potSize: number;
  bettingRound?: {
    currentBet: number;
    lastAction: PlayerAction | null;
    lastRaiseAmount: number;
    currentPlayerToAct: string | null;
    timeRemaining: number;
    timeCookiesUsedThisRound: number;
  } | null;
}
