// src/game/betting/BettingTypes.ts

import { PlayerInGame } from '../types/PlayerInGame';

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface BettingState {
  timeRemaining: number;
  timeCookiesUsedThisRound: number;
  playerValidActions: PlayerAction[];
  playerToAct: string;
  potContributions: Map<PlayerInGame, number>; //The contribution of each player to the pot this current betting round
}

export interface TableConfig {
  timePerAction: number;
  minBet: number;
  maxBet: number;
  timeCookieEffect: number;
  sbAmount: number;
  bbAmount: number;
  minPlayers: number;
}

export interface ActionValidationResult {
  isValid: boolean;
  error?: string;
}

export function getTableConfig(
  timePerAction: number,
  minBet: number,
  maxBet: number,
  timeCookieEffect: number,
  sbAmount: number,
  bbAmount: number,
  minPlayers: number
) {
  return {
    timePerAction: timePerAction,
    minBet: minBet,
    maxBet: maxBet,
    timeCookieEffect: timeCookieEffect,
    sbAmount: sbAmount,
    bbAmount: bbAmount,
    minPlayers: minPlayers,
  };
}
