// Player.ts
import { Mutex } from 'async-mutex';
import { Game } from '../game/Game';

export class Player {
  private id: string;
  private socketId: string;

  private name: string;
  private bankCoins: number;
  private remainingTimeCookies: number;
  private activeGames: Set<string>;
  private bankLock: Mutex;
  private timebankCookiesLock: Mutex;
  private activeGamesLock = new Mutex();

  constructor(id: string, name: string, socketId: any) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.remainingTimeCookies = 1;
    this.bankCoins = 10000000;
    this.activeGames = new Set();
    this.bankLock = new Mutex();
    this.activeGamesLock = new Mutex();
    this.timebankCookiesLock = new Mutex();
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSocketId(): string {
    return this.socketId;
  }

  async buyIntoGame(amount: number, game: Game): Promise<boolean> {
    return await this.bankLock.runExclusive(async () => {
      const playerInGame = game.getPlayer(this.id);
      if (!playerInGame || this.bankCoins < amount) return false;
      this.bankCoins -= amount;
      return true;
    });
  }

  async addToBankCoins(amount: number): Promise<void> {
    await this.bankLock.runExclusive(async () => {
      this.bankCoins += amount;
    });
  }

  async getTimebankCookies(): Promise<number> {
    return this.remainingTimeCookies;
  }

  async useTimebankCookie(): Promise<boolean> {
    return await this.timebankCookiesLock.runExclusive(async () => {
      if (this.remainingTimeCookies <= 0) return false;
      this.remainingTimeCookies -= 1;
      return true;
    });
  }

  async addActiveGame(gameId: string): Promise<void> {
    await this.activeGamesLock.runExclusive(async () => {
      this.activeGames.add(gameId);
    });
  }

  async removeActiveGame(gameId: string): Promise<void> {
    await this.activeGamesLock.runExclusive(async () => {
      this.activeGames.delete(gameId);
    });
  }

  async isInGame(gameId: string): Promise<boolean> {
    return await this.activeGamesLock.runExclusive(async () => {
      return this.activeGames.has(gameId);
    });
  }

  async getActiveGamesId(): Promise<Set<string>> {
    return await this.activeGamesLock.runExclusive(async () => {
      return this.activeGames;
    });
  }
}
