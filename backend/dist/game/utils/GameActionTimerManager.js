"use strict";
// src/game/utils/GameActionTimer.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameActionTimerManager = void 0;
class GameActionTimerManager {
    constructor(config) {
        this.config = config;
        this._mainTimer = null;
        this._bufferTimer = null;
        this._isActionReceived = false;
        this._timebackCookiesUsedThisRound = 0;
        this._timeRemaining = config.duration;
    }
    start() {
        this._isActionReceived = false;
        this.startMainTimer();
    }
    startMainTimer() {
        this.config.updateTimeRemianing(this._timeRemaining);
        if (this._mainTimer)
            clearTimeout(this._mainTimer);
        this._mainTimer = setTimeout(() => {
            this.startBufferTimer(); // A grace period to avoid a race on action between client and timout event due to network latency
        }, this._timeRemaining);
    }
    startBufferTimer() {
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
    handleTimebankCookie() {
        if (this._timebackCookiesUsedThisRound >= this.config.maxCookiesPerRound) {
            return false;
        }
        this._timebackCookiesUsedThisRound++;
        this._timeRemaining += this.config.timeCookieEffect;
        // Restart main timer with extended time
        this.startMainTimer();
        return true;
    }
    handleAction() {
        if (!this._isActionReceived) {
            this._isActionReceived = true;
            this.cleanup();
            if (this.config.onComplete) {
                this.config.onComplete();
            }
        }
    }
    clear() {
        this.cleanup();
    }
    cleanup() {
        if (this._mainTimer) {
            clearTimeout(this._mainTimer);
            this._mainTimer = null;
        }
        if (this._bufferTimer) {
            clearTimeout(this._bufferTimer);
            this._bufferTimer = null;
        }
    }
    isActive() {
        return !!(this._mainTimer || this._bufferTimer);
    }
    getTimeRemaining() {
        return this._timeRemaining;
    }
}
exports.GameActionTimerManager = GameActionTimerManager;
//# sourceMappingURL=GameActionTimerManager.js.map