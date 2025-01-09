// src/game/betting/types.ts

import { GamePhase } from '../types/GameStateUtils';

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface BettingState {
  currentBet: number;
  lastAction: PlayerAction | null;
  lastRaiseAmount: number;
  timeCookiesUsedThisRound: number;
}

export interface BettingConfig {
  timePerAction: number;
  bettingRound: GamePhase;
  minBet: number;
  maxBet: number;
  timeCookieEffect: number;
}

export interface ActionValidationResult {
  isValid: boolean;
  error?: string;
}
