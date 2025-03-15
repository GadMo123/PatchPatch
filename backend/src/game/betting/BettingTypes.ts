// src/game/betting/BettingTypes.ts - should be moved other places , TODO

import { BettingTypes } from "@patchpatch/shared";
import { PlayerInGame } from "../types/PlayerInGame";

export interface BettingState {
  timeRemaining: number;
  timeCookiesUsedThisRound: number;
  playerValidActions: BettingTypes[];
  playerToAct: string;
  potContributions: Map<PlayerInGame, number>; //The contribution of each player to the pot this current betting round
  minRaiseAmount: number;
  callAmount?: number;
  allInAmount: number;
}

export interface TableConfig {
  timePerArrangeAction: number;
  timePerAction: number;
  minBet: number;
  maxBet: number;
  timeCookieEffect: number;
  sbAmount: number;
  bbAmount: number;
  minPlayers: number;
  maxPlayers: number;
  minBuyin: number;
  maxBuyin: number;
}

export interface ActionValidationResult {
  isValid: boolean;
  error?: string;
}
