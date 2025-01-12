// src/game/betting/TimerManager.ts
import { Server } from 'socket.io';
import { Timer } from '../types/Timer';
import { BettingConfig, BettingState } from './BettingTypes';
import { PlayerInGame } from '../types/PlayerInGame';
import { Game } from '../Game';
import { BettingManager } from './BettingManager';

export class TimerManager {
  private readonly MAX_TIME_COOKIES_PER_ROUND = 3;
  private timeRemaining: number;
  private timeCookiesUsedThisRound: number = 0;
  private bettingManager: BettingManager;

  constructor(
    private timer: Timer,
    private config: BettingConfig,
    private theBettingManager: BettingManager
  ) {
    this.timeRemaining = config.timePerAction;
    this.bettingManager = theBettingManager;
  }

  startTimer(player: PlayerInGame, onTimeout: () => void): void {
    this.timer.start(this.timeRemaining, onTimeout);
    this.bettingManager.updateBettingState({
      timeRemaining: this.timeRemaining,
    });
  }

  handleTimeCookie(player: PlayerInGame): boolean {
    if (!player.hasTimeCookies()) return false;
    if (this.timeCookiesUsedThisRound > this.MAX_TIME_COOKIES_PER_ROUND)
      return false;
    player.useTimeCookie();
    this.timeCookiesUsedThisRound++;
    this.timeRemaining += this.config.timeCookieEffect;
    this.bettingManager.updateBettingState({
      timeRemaining: this.timeRemaining,
    });
    return true;
  }

  resetRoundCookies(): void {
    this.timeCookiesUsedThisRound = 0;
  }

  clear(): void {
    this.timer.clear();
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }
}
