// src/game/betting/BettingTypes.ts

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface BettingState {
  timeRemaining: number;
  currentBet: number;
  lastAction: PlayerAction | null;
  lastRaiseAmount: number;
  timeCookiesUsedThisRound: number;
}

export interface BettingConfig {
  timePerAction: number;
  minBet: number;
  maxBet: number;
  timeCookieEffect: number;
}

export interface ActionValidationResult {
  isValid: boolean;
  error?: string;
}

export function getBettingConfig(
  timePerAction: number,
  minBet: number,
  maxBet: number,
  timeCookieEffect: number
) {
  return {
    timePerAction: timePerAction,
    minBet: minBet,
    maxBet: maxBet,
    timeCookieEffect: timeCookieEffect,
  };
}
