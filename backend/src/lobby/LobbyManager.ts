import {
  GameSpeed,
  GameStatus,
  GameType,
  LobbyStatusServerResponse,
} from "@patchpatch/shared";
import { GamePhase } from "../game/types/GameState";
import { Game } from "../game/Game";
import { getStakes } from "game/betting/BettingTypes";

export function getLobbyStatus(
  games: Record<string, Game>
): LobbyStatusServerResponse {
  const gameList = Object.values(games).map((game) => {
    const tableConfig = game.getTableConfig();

    // Classify game speed
    const getGameSpeed = (timePerAction: number): GameSpeed => {
      if (timePerAction >= 20000) return GameSpeed.SLOW;
      if (timePerAction >= 14000) return GameSpeed.MID;
      return GameSpeed.FAST;
    };

    return {
      id: game.getId(),
      gameType: GameType.Patch_Patch, // todo - more games
      BBAmount: tableConfig.bbAmount,
      stakes: getStakes(tableConfig.sbAmount, tableConfig.bbAmount),
      players:
        game
          .getPlayersBySeat()
          .filter((player) => player != null)
          ?.map((player) => player?.getName() || "Empty") ?? [],
      status:
        game.getStatus() === GamePhase.Waiting
          ? GameStatus.WAITING
          : GameStatus.RUNNING,
      maxPlayers: tableConfig.maxPlayers,
      gameSpeed: getGameSpeed(tableConfig.timePerAction),
    };
  });

  return { success: true, games: gameList };
}
