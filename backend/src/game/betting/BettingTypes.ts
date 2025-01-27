// src/game/betting/BettingTypes.ts

import { PlayerInGame } from '../types/PlayerInGame';

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface BettingState {
  lastRaise: number;
  timeRemaining: number;
  timeCookiesUsedThisRound: number;
  playerValidActions: PlayerAction[];
  playerToAct: string;
  potContributions: Map<PlayerInGame, number>; //The contribution of each player to the pot this current betting round
}

export interface BettingConfig {
  timePerAction: number;
  minBet: number;
  maxBet: number;
  timeCookieEffect: number;
  sbAmount: number;
  bbAmount: number;
}

export interface ActionValidationResult {
  isValid: boolean;
  error?: string;
}

export function getBettingConfig(
  timePerAction: number,
  minBet: number,
  maxBet: number,
  timeCookieEffect: number,
  sbAmount: number,
  bbAmount: number
) {
  return {
    timePerAction: timePerAction,
    minBet: minBet,
    maxBet: maxBet,
    timeCookieEffect: timeCookieEffect,
    sbAmount: sbAmount,
    bbAmount: bbAmount,
  };
}
