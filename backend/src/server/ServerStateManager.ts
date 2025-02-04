// src/server/StateManager.ts

import { Player } from "../player/Player";
import { Game } from "../game/Game";

//todo : all shared data access should be async,
export class ServerStateManager {
  private static _instance: ServerStateManager;

  private _players: Record<string, Player> = {};
  private _games: Record<string, Game> = {};

  private constructor() {}

  public static getInstance(): ServerStateManager {
    if (!ServerStateManager._instance) {
      ServerStateManager._instance = new ServerStateManager();
    }
    return ServerStateManager._instance;
  }

  public getPlayers(): Record<string, Player> {
    return this._players;
  }

  public getPlayer(playerId: string): Player | null {
    return this._players[playerId] || null;
  }

  public addPlayer(player: Player): void {
    this._players[player.getId()] = player;
  }

  public removePlayer(playerId: string): void {
    delete this._players[playerId];
  }

  public getGames(): Record<string, Game> {
    return this._games;
  }

  public getGame(gameId: string): Game | null {
    return this._games[gameId] || null;
  }

  public addGame(game: Game): void {
    this._games[game.getId()] = game;
  }

  public removeGame(gameId: string): void {
    delete this._games[gameId];
  }
}
