// src/lobby/LobbyManager.ts

import { Game } from '../game/Game';
import { PositionsUtils } from '../game/utils/PositionsUtils';
import { ServerStateManager } from '../server/ServerStateManager';

interface JoinGameResult {
  success: boolean;
  message?: string;
}

export async function handleJoinGame(
  game: Game,
  socketId: string,
  buyIn: number,
  position: string,
  serverStateManager: ServerStateManager
): Promise<JoinGameResult> {
  const player = serverStateManager.getPlayer(socketId);
  if (player == null)
    return { success: false, message: 'Player not logged in' };
  await game.getPositionLock().acquire(); // Acquire the lock
  try {
    const added = await game.addPlayer(
      player,
      buyIn,
      PositionsUtils.getPosition(position)
    ); // Await the addPlayer Promise
    if (added)
      return { success: true }; // Player successfully added
    else return { success: false, message: 'Failed to join game' };
  } catch (error) {
    console.error('Error joining game:', error);
    return {
      success: false,
      message: 'An error occurred while joining the game',
    };
  } finally {
    game.getPositionLock().release(); // Release the lock
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
