// src/utils/Timer.ts
export class Timer {
  private _timeoutId: NodeJS.Timeout | null = null;

  start(duration: number, callback: () => void) {
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
