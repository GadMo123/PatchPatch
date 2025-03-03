// src/lobby/LobbyManager.ts - Provides accessible lobby status representation for clients.

import { LobbyStatusServerResponse } from "@patchpatch/shared";
import { GamePhase } from "../game/types/GameState";
import { Game } from "../game/Game";

export function getLobbyStatus(
  games: Record<string, Game>
): LobbyStatusServerResponse {
  const gameList = Object.values(games).map((game) => ({
    id: game.getId(),
    blindLevel: game.getStakes(),
    players:
      game.getPlayersBySeat()?.map((player) => player?.getName() || "Empty") ??
      [],
    status: game.getStatus() === GamePhase.Waiting ? "waiting" : "running",
    maxPlayers: game.getTableConfig().maxPlayers,
  }));
  return { success: true, games: gameList };
}
