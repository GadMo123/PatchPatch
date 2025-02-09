// Fits players data for each seat using the latest gamestate braodcasted:
// If the player is playing in the game (= not an observer) then rotate all positions to fit hero seat into the bottom-center seat while keeping position relative order.

import {
  GameStateServerBroadcast,
  PublicPlayerClientData,
} from "@patchpatch/shared";
import { TableProps } from "../gameComponents/tableAndSeats/TableAndSeats";

// else if the player is not in the game - use positions as is from server state braodcast.
export const getTablePropsFromGameState = (
  gameState: GameStateServerBroadcast | null,
  playerId: string
): TableProps | null => {
  if (!gameState?.publicPlayerDataMapByPosition) return null;

  const numberOfSeats = gameState.tableConfig.maxPlayers as 2 | 3 | 6;
  const seats: { [index: number]: PublicPlayerClientData } = {};

  let tableRotation = 0;
  let isJoinedGame = false;

  // First pass: find the hero's absolute position to calculate rotation
  Object.values(gameState.publicPlayerDataMapByPosition).forEach(
    (playerData) => {
      if (playerData.id === playerId) {
        isJoinedGame = true;
        tableRotation = playerData.tableAbsolotePosition;
      }
    }
  );

  // Second pass: populate seats with rotated positions
  Object.entries(gameState.publicPlayerDataMapByPosition).forEach(
    ([__position, playerData]) => {
      // Calculate the rotated seat index
      let rotatedSeatIndex =
        (playerData.tableAbsolotePosition - tableRotation + numberOfSeats) %
        numberOfSeats;

      // Create the seat info
      seats[rotatedSeatIndex] = playerData;
    }
  );

  return {
    numberOfSeats,
    seatsMap: seats,
    isJoinedGame,
  };
};
