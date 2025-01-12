class PositionLock {
  private isLocked = false;
  private waiting: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (this.isLocked) {
      await new Promise<void>(resolve => this.waiting.push(resolve));
    }
    this.isLocked = true;
  }

  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) next();
    } else {
      this.isLocked = false;
    }
  }
}
