// src/utils/Timer.ts
export class Timer {
  private timeoutId: NodeJS.Timeout | null = null;

  start(duration: number, callback: () => void) {
    this.clear();
    this.timeoutId = setTimeout(callback, duration);
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
