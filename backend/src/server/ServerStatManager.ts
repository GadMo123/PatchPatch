// src/server/StateManager.ts

import { Player } from '../player/Player';
import { Game } from '../game/Game';

export class ServerStateManager {
  private static instance: ServerStateManager;

  private players: Record<string, Player> = {};
  private games: Record<string, Game> = {};

  // Private constructor to prevent direct instantiation
  private constructor() {}

  // Public method to access the singleton instance
  public static getInstance(): ServerStateManager {
    if (!ServerStateManager.instance) {
      ServerStateManager.instance = new ServerStateManager();
    }
    return ServerStateManager.instance;
  }

  // Getter and setter methods for players
  public getPlayers(): Record<string, Player> {
    return this.players;
  }

  public getPlayer(playerId: string): Player | null {
    return this.players[playerId] || null;
  }

  public addPlayer(player: Player): void {
    this.players[player.id] = player;
  }

  public removePlayer(playerId: string): void {
    delete this.players[playerId];
  }

  // Getter and setter methods for games
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
