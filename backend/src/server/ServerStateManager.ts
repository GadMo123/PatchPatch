// src/server/StateManager.ts

import { Player } from '../player/Player';
import { Game } from '../game/Game';

//todo : all shared data access should be async
export class ServerStateManager {
  private static instance: ServerStateManager;

  private players: Record<string, Player> = {};
  private games: Record<string, Game> = {};

  private constructor() {}

  public static getInstance(): ServerStateManager {
    if (!ServerStateManager.instance) {
      ServerStateManager.instance = new ServerStateManager();
    }
    return ServerStateManager.instance;
  }

  public getPlayers(): Record<string, Player> {
    return this.players;
  }

  public getPlayer(playerId: string): Player | null {
    return this.players[playerId] || null;
  }

  public addPlayer(player: Player): void {
    this.players[player.getId()] = player;
  }

  public removePlayer(playerId: string): void {
    delete this.players[playerId];
  }

  public getGames(): Record<string, Game> {
    return this.games;
  }

  public getGame(gameId: string): Game | null {
    return this.games[gameId] || null;
  }

  public addGame(game: Game): void {
    this.games[game.getId()] = game;
  }

  public removeGame(gameId: string): void {
    delete this.games[gameId];
  }
}
