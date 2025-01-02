// src/lobby/LobbyManager.ts

import { Socket } from 'socket.io';
import { Game } from '../game/Game';
import { Player } from '../player/Player';

export function handleJoinGame(
  game: Game,
  socketId: string,
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
    if (!game.playersList.some(p => p.id === player.id)) {
      game.addPlayer(player);
    }
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
    id: game.getid,
    blindLevel: game.getStakes,
    players: game.playersList.map((player: Player) => player.name),
    state: game.getState(),
  }));
  return { success: true, games: gameList };
}
