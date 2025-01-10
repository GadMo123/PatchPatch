// src/game/betting/TimerManager.ts
import { Server } from 'socket.io';
import { Timer } from '../types/Timer';
import { BettingConfig } from './types';
import { PlayerInGame } from '../types/PlayerInGame';

export class TimerManager {
  private readonly MAX_TIME_COOKIES_PER_ROUND = 3;
  private timeRemaining: number;
  private timeCookiesUsedThisRound: number = 0;

  constructor(
    private io: Server,
    private timer: Timer,
    private config: BettingConfig
  ) {
    this.timeRemaining = config.timePerAction;
  }

  startTimer(player: PlayerInGame, onTimeout: () => void): void {
    this.timeRemaining = this.config.timePerAction;
    this.timer.start(this.timeRemaining, onTimeout);
  }

  handleTimeCookie(player: PlayerInGame): boolean {
    if (!player.hasTimeCookies()) {
      this.emitError(player, 'No time cookies available');
      return false;
    }

    if (this.timeCookiesUsedThisRound > this.MAX_TIME_COOKIES_PER_ROUND) {
      this.emitError(
        player,
        'Maximum time cookies for this round already used'
      );
      return false;
    }

    player.useTimeCookie();
    this.timeCookiesUsedThisRound++;
    this.timeRemaining += this.config.timeCookieEffect;

    this.io.emit('time-cookie-used', {
      playerId: player.id,
      timeRemaining: this.timeRemaining,
      timeCookiesUsed: this.timeCookiesUsedThisRound,
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

  private emitError(player: PlayerInGame, message: string): void {
    this.io.to(player.socketId).emit('time-cookie-error', { message });
  }
}
