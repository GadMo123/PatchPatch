// src/game/utils/GameActionTimer.ts

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
  private mainTimer: NodeJS.Timeout | null = null;
  private bufferTimer: NodeJS.Timeout | null = null;
  private isActionReceived: boolean = false;
  private timeRemaining: number;
  private timebackCookiesUsedThisRound: number = 0;

  constructor(private config: TimerConfig) {
    this.timeRemaining = config.duration;
  }

  start(): void {
    this.isActionReceived = false;
    this.startMainTimer();
  }

  private startMainTimer(): void {
    this.config.updateTimeRemianing(this.timeRemaining);
    if (this.mainTimer) clearTimeout(this.mainTimer);

    this.mainTimer = setTimeout(() => {
      this.startBufferTimer(); // A grace period to avoid a race on action between client and timout event due to network latency
    }, this.timeRemaining);
  }

  private startBufferTimer(): void {
    // Start buffer timer to account for network latency
    this.bufferTimer = setTimeout(() => {
      if (!this.isActionReceived) {
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
    if (this.timebackCookiesUsedThisRound >= this.config.maxCookiesPerRound) {
      return false;
    }

    this.timebackCookiesUsedThisRound++;
    this.timeRemaining += this.config.timeCookieEffect;

    // Restart main timer with extended time
    this.startMainTimer();
    return true;
  }

  handleAction(): void {
    if (!this.isActionReceived) {
      this.isActionReceived = true;
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
    if (this.mainTimer) {
      clearTimeout(this.mainTimer);
      this.mainTimer = null;
    }
    if (this.bufferTimer) {
      clearTimeout(this.bufferTimer);
      this.bufferTimer = null;
    }
  }

  isActive(): boolean {
    return !!(this.mainTimer || this.bufferTimer);
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }
}
