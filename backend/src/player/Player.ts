// Player.ts - A representation of a logged in player.
import { Mutex } from "async-mutex";
import { Game } from "../game/Game";

export class Player {
  private bankCoins: number;
  private remainingTimeCookies: number;
  private activeGames: Set<string>;
  private bankLock: Mutex;
  private timebankCookiesLock: Mutex;
  private activeGamesLock = new Mutex();

  constructor(
    private _id: string,
    private _name: string,
    private _socketId: any
  ) {
    this.remainingTimeCookies = 1;
    this.bankCoins = 10000000;
    this.activeGames = new Set();
    this.bankLock = new Mutex();
    this.activeGamesLock = new Mutex();
    this.timebankCookiesLock = new Mutex();
  }

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  getSocketId(): string {
    return this._socketId;
  }

  async buyIntoGame(amount: number, game: Game): Promise<boolean> {
    return await this.bankLock.runExclusive(async () => {
      const playerInGame = game.getPlayer(this._id);
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
