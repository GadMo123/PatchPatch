// src/lobby/LobbyManager.ts

import { Game } from '../game/Game';

export function handleLobbyStatus(games: Record<string, Game>): {
  success: boolean;
  games: any[];
} {
  const gameList = Object.values(games).map(game => ({
    id: game.getId(),
    blindLevel: game.getStakes(),
    players: Array.from(game.getPlayersInGame()?.values() || []).map(
      player => player?.getName() || 'empty'
    ),
    status: game.getStatus(),
  }));
  return { success: true, games: gameList };
}
