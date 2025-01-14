// src/lobby/LobbyManager.ts

import { Game } from '../game/Game';
import { PositionsUtils } from '../game/types/PositionsUtils';

export function handleJoinGame(
  game: Game,
  socketId: string,
  buyIn: number,
  position: string,
  players: { [socketId: string]: any }
): { success: boolean; message?: string } {
  if (!game) {
    return { success: false, message: 'Game not found' };
  }

  const player = players[socketId];
  if (!player) {
    return { success: false, message: 'Player not logged in' };
  }

  try {
    const p = PositionsUtils.getPosition(position);
    game.addPlayer(player, buyIn, p);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export function handleLobbyStatus(games: Record<string, Game>): {
  success: boolean;
  games: any[];
} {
  const gameList = Object.values(games).map(game => ({
    id: game.getId(),
    blindLevel: game.getStakes(),
    players: Array.from(game.getPlayersInGame()?.values() || []).map(
      player => player?.name || 'empty'
    ),
    status: game.getStatus(),
  }));
  return { success: true, games: gameList };
}
