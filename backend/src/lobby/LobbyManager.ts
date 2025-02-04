// src/lobby/LobbyManager.ts

import { LobbyStatusServerResponse } from "shared";
import { GamePhase } from "../game/broadcasting/GameState";
import { Game } from "../game/Game";

export function getLobbyStatus(
  games: Record<string, Game>
): LobbyStatusServerResponse {
  const gameList = Object.values(games).map((game) => ({
    id: game.getId(),
    blindLevel: game.getStakes(),
    players:
      Array.from(game.getPlayersInGame()?.values() || []).map(
        (player) => player?.getName() || "Empty"
      ) ?? [],
    status: game.getStatus() === GamePhase.Waiting ? "waiting" : "running",
    maxPlayers: game.getTableConfig().maxPlayers,
  }));
  return { success: true, games: gameList };
}
