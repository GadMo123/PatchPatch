// src/game/utils/GameActionTimerManager.ts - Manages action timers with timeout handling and protection against race conditions

import { Mutex } from "async-mutex";

export interface GameActionTimerConfig {
  duration: number; // Duration of the timer in milliseconds
  networkBuffer: number; // Buffer time for network lag
  timeCookieEffect: number; // Additional time added when using a time cookie/extension
  maxCookiesPerRound: number; // Maximum number of time cookies that can be used per round
  updateTimeRemianing: (timeRemaining: number) => void; // Callback to update UI with remaining time
  onTimeout: () => void; // Callback executed when timer expires
  onComplete: () => void; // Callback executed when timer is complete (either timeout or action received)
}

export class GameActionTimerManager {
  private _timer: NodeJS.Timeout | null = null;
  private _startTime: number = 0;
  private _duration: number;
  private _networkBuffer: number;
  private _timeCookieEffect: number;
  private _maxCookiesPerRound: number;
  private _updateTimeRemianing: (timeRemaining: number) => void;
  private _onTimeout: () => void;
  private _onComplete: () => void;
  private _mutex: Mutex;
  private _isRunning: boolean = false;
  private _cookiesUsed: number = 0;
  private _updateInterval: NodeJS.Timeout | null = null;
  private _isTimedOut: boolean = false;

  constructor(config: GameActionTimerConfig) {
    this._duration = config.duration;
    this._networkBuffer = config.networkBuffer;
    this._timeCookieEffect = config.timeCookieEffect;
    this._maxCookiesPerRound = config.maxCookiesPerRound;
    this._updateTimeRemianing = config.updateTimeRemianing;
    this._onTimeout = config.onTimeout;
    this._onComplete = config.onComplete;
    this._mutex = new Mutex();
  }

  /**
   * Starts the action timer
   * @param takeDefaultAction If true, immediately executes default action without waiting (for sitting out players)
   * @param afterFunction Optional function to call after timer is started
   */
  public start(
    takeDefaultAction: boolean = false,
    afterFunction?: () => void
  ): void {
    // Handle immediate default action for sitting out players
    if (takeDefaultAction) {
      console.log("Taking default action for sitting out player");
      // Important: Call onTimeout first, then onComplete
      this._onTimeout();
      this._onComplete();
      if (afterFunction) afterFunction();
      return;
    }

    this._mutex.acquire().then((release) => {
      try {
        this._isRunning = true;
        this._isTimedOut = false;
        this._startTime = Date.now();

        // Clear any existing timers
        this.clearTimers();

        // Set the timeout timer
        this._timer = setTimeout(() => {
          this._mutex.acquire().then((timeoutRelease) => {
            let shouldExecuteTimeout = false;
            try {
              if (this._isRunning && !this._isTimedOut) {
                console.log("Timer expired - executing timeout");
                this._isTimedOut = true;
                this._isRunning = false;
                shouldExecuteTimeout = true;
              }
            } finally {
              timeoutRelease();
              // Execute callbacks after releasing the mutex
              if (shouldExecuteTimeout) {
                console.log("Executing onTimeout callback");
                this._onTimeout();
                this._onComplete();
              }
            }
          });
        }, this._duration + this._networkBuffer);

        // Initial time update
        this._updateTimeRemianing(this._duration);

        // Start the update interval to update UI with remaining time
        this._updateInterval = setInterval(() => {
          if (this._isRunning) {
            const elapsed = Date.now() - this._startTime;
            const remaining = Math.max(0, this._duration - elapsed);
            this._updateTimeRemianing(remaining);
          }
        }, 1000);
      } finally {
        release();
        if (afterFunction) afterFunction();
      }
    });
  }

  /**
   * Handles when a valid action is received from the player
   */
  public handleAction(): void {
    this._mutex.acquire().then((release) => {
      let shouldExecuteComplete = false;
      try {
        if (this._isRunning && !this._isTimedOut) {
          console.log("Action received - cancelling timeout");
          this._isRunning = false;
          this.clearTimers();
          shouldExecuteComplete = true;
        }
      } finally {
        release();
        // Execute the complete callback after releasing the mutex
        if (shouldExecuteComplete) {
          console.log("Executing onComplete callback");
          this._onComplete();
        }
      }
    });
  }

  /**
   * Adds extra time when player uses a time cookie/extension
   * @returns boolean - Whether the time cookie was successfully used
   */
  public async useTimeCookie(): Promise<boolean> {
    return await this._mutex.runExclusive(() => {
      if (!this._isRunning || this._cookiesUsed >= this._maxCookiesPerRound) {
        return false;
      }

      this._cookiesUsed++;

      // Clear current timer
      if (this._timer) {
        clearTimeout(this._timer);
      }

      // Extend the duration by adding the cookie effect time
      const elapsed = Date.now() - this._startTime;
      const remainingTime = Math.max(0, this._duration - elapsed);
      const newDuration = remainingTime + this._timeCookieEffect;

      // Set new timer
      this._timer = setTimeout(() => {
        this._mutex.acquire().then((timeoutRelease) => {
          let shouldExecuteTimeout = false;
          try {
            if (this._isRunning && !this._isTimedOut) {
              this._isTimedOut = true;
              this._isRunning = false;
              shouldExecuteTimeout = true;
            }
          } finally {
            timeoutRelease();
            // Execute callbacks after releasing the mutex
            if (shouldExecuteTimeout) {
              this._onTimeout();
              this._onComplete();
            }
          }
        });
      }, newDuration + this._networkBuffer);

      // Update the duration and start time to reflect the new timing
      this._startTime = Date.now() - (this._duration - remainingTime);
      this._duration = this._duration + this._timeCookieEffect;

      return true;
    });
  }

  /**
   * Gets the number of time cookies used in this round
   */
  public getCookiesUsed(): number {
    return this._cookiesUsed;
  }

  /**
   * Check if the timer is currently running
   */
  public isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Stops the timer and cleans up
   */
  public stop(): void {
    this._mutex.runExclusive(() => {
      this._isRunning = false;
      this.clearTimers();
    });
  }

  /**
   * Resets the timer state for a new round
   */
  public reset(): void {
    this._mutex.runExclusive(() => {
      this._isRunning = false;
      this._cookiesUsed = 0;
      this._isTimedOut = false;
      this.clearTimers();
    });
  }

  /**
   * Gets the remaining time in milliseconds
   */
  public getRemainingTime(): number {
    if (!this._isRunning) {
      return 0;
    }

    const elapsed = Date.now() - this._startTime;
    return Math.max(0, this._duration - elapsed);
  }

  /**
   * Clear all active timers
   */
  private clearTimers(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }
}
