// src/lobby/LobbyManager.ts

import { GamePhase } from '../game/broadcasting/GameState';
import { Game } from '../game/Game';

export interface LobbyStatus {
  success: boolean;
  games: Object[];
}

export function getLobbyStatus(games: Record<string, Game>): LobbyStatus {
  const gameList = Object.values(games).map(game => ({
    id: game.getId(),
    blindLevel: game.getStakes(),
    players: Array.from(game.getPlayersInGame()?.values() || []).map(
      player => player?.getName() || 'empty'
    ),
    status: game.getStatus() === GamePhase.Waiting ? 'waiting' : 'running',
  }));
  return { success: true, games: gameList };
}
