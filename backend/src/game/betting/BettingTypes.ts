// src/game/betting/BettingTypes.ts - should be moved other places , TODO

import { BettingTypes } from "@patchpatch/shared";
import { PlayerInGame } from "../types/PlayerInGame";

export interface BettingState {
  activePlayerRoundPotContributions: number;
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
  showdownAnimationTime: number;
  noShowDwonAnimationTime: number;
}

export interface ActionValidationResult {
  isValid: boolean;
  error?: string;
}

// Builder class for TableConfig
export class TableConfigBuilder {
  private config: TableConfig;

  constructor() {
    // Default values (change all on game creation)
    this.config = {
      timePerArrangeAction: 10000,
      timePerAction: 10,
      minBet: 5,
      maxBet: Infinity,
      timeCookieEffect: 600000,
      sbAmount: 2,
      bbAmount: 5,
      minPlayers: 2,
      maxPlayers: 6,
      minBuyin: 50,
      maxBuyin: 500,
      showdownAnimationTime: 7000,
      noShowDwonAnimationTime: 3000,
    };
  }

  // Set each property, we don't check for bad input ATM, handle with care!!
  setTimePerArrangeAction(time: number): TableConfigBuilder {
    this.config.timePerArrangeAction = time;
    return this;
  }

  setTimePerAction(time: number): TableConfigBuilder {
    this.config.timePerAction = time;
    return this;
  }

  setMinBet(minBet: number): TableConfigBuilder {
    this.config.minBet = minBet;
    return this;
  }

  setMaxBet(maxBet: number): TableConfigBuilder {
    this.config.maxBet = maxBet;
    return this;
  }

  setTimeCookieEffect(time: number): TableConfigBuilder {
    this.config.timeCookieEffect = time;
    return this;
  }

  setSbAmount(amount: number): TableConfigBuilder {
    this.config.sbAmount = amount;
    return this;
  }

  setBbAmount(amount: number): TableConfigBuilder {
    this.config.bbAmount = amount;
    return this;
  }

  setMinPlayers(min: number): TableConfigBuilder {
    this.config.minPlayers = min;
    return this;
  }

  setMaxPlayers(max: number): TableConfigBuilder {
    this.config.maxPlayers = max;
    return this;
  }

  setMinBuyin(min: number): TableConfigBuilder {
    this.config.minBuyin = min;
    return this;
  }

  setMaxBuyin(max: number): TableConfigBuilder {
    this.config.maxBuyin = max;
    return this;
  }

  setShowdownAnimationTime(time: number): TableConfigBuilder {
    this.config.showdownAnimationTime = time;
    return this;
  }

  setNoShowdownAnimationTime(time: number): TableConfigBuilder {
    this.config.noShowDwonAnimationTime = time;
    return this;
  }

  // Build the final config object
  build(): TableConfig {
    return this.config;
  }
}

export const getStakes = (sb: number, bb: number): string => `${sb}-${bb}`;
