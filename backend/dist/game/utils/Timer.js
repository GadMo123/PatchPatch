"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = void 0;
// src/utils/Timer.ts
class Timer {
    constructor() {
        this._timeoutId = null;
    }
    start(duration, callback) {
        this.clear();
        this._timeoutId = setTimeout(callback, duration);
    }
    clear() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    }
}
exports.Timer = Timer;
//# sourceMappingURL=Timer.js.map