// src/game/utils/GameActionTimer.ts - Manage a timed action timer, take default action on timeout and accept timebank extenders request.

export interface TimerConfig {
  duration: number;
  networkBuffer: number;
  timeCookieEffect: number;
  maxCookiesPerRound: number;
  updateTimeRemianing: (timeLeft: number) => void;
  onTimeout: () => void;
  onComplete?: () => void;
}

export class GameActionTimerManager {
  private _mainTimer: NodeJS.Timeout | null = null;
  private _bufferTimer: NodeJS.Timeout | null = null;
  private _isActionReceived: boolean = false;
  private _timeRemaining: number;
  private _timebackCookiesUsedThisRound: number = 0;

  constructor(private config: TimerConfig) {
    this._timeRemaining = config.duration;
  }

  start(takeDefualtAction: boolean): void {
    this._isActionReceived = false;
    this.startMainTimer(takeDefualtAction);
  }

  private startMainTimer(takeDefualtAction: boolean): void {
    const timeToAct = takeDefualtAction ? 0 : this._timeRemaining;
    this.config.updateTimeRemianing(timeToAct);
    if (this._mainTimer) clearTimeout(this._mainTimer);

    this._mainTimer = setTimeout(() => {
      this.startBufferTimer(); // A grace period to avoid a race on action between client and timout event due to network latency
    }, timeToAct);
  }

  private startBufferTimer(): void {
    // Start buffer timer to account for network latency
    this._bufferTimer = setTimeout(() => {
      if (!this._isActionReceived) {
        // If no action was received during buffer, execute timeout callback
        this.config.onTimeout();
      }
      this.cleanup();
      if (this.config.onComplete) {
        this.config.onComplete();
      }
    }, this.config.networkBuffer);
  }

  handleTimebankCookie(): boolean {
    if (this._timebackCookiesUsedThisRound >= this.config.maxCookiesPerRound) {
      return false;
    }

    this._timebackCookiesUsedThisRound++;
    this._timeRemaining += this.config.timeCookieEffect;

    // Restart main timer with extended time
    this.startMainTimer(false);
    return true;
  }

  handleAction(): void {
    if (!this._isActionReceived) {
      this._isActionReceived = true;
      this.cleanup();
      if (this.config.onComplete) {
        this.config.onComplete();
      }
    }
  }

  clear(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this._mainTimer) {
      clearTimeout(this._mainTimer);
      this._mainTimer = null;
    }
    if (this._bufferTimer) {
      clearTimeout(this._bufferTimer);
      this._bufferTimer = null;
    }
  }

  isActive(): boolean {
    return !!(this._mainTimer || this._bufferTimer);
  }

  getTimeRemaining(): number {
    return this._timeRemaining;
  }
}
