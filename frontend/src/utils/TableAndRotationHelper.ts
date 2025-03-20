// Fits players data for each seat using the latest gamestate braodcasted:
// If the player is playing in the game (= not an observer) then rotate all positions to fit hero seat into the bottom-center seat while keeping position relative order.

import {
  GameStateServerBroadcast,
  PublicPlayerClientData,
} from "@patchpatch/shared";
import { TableProps } from "../gameComponents/tableAndSeats/TableAndSeats";

export const getTablePropsFromGameState = (
  gameState: GameStateServerBroadcast | null,
  playerId: string
): TableProps | null => {
  if (!gameState?.publicPlayerDataMapByTablePosition) return null;

  const numberOfSeats = gameState.tableConfig.maxPlayers as 2 | 3 | 6;
  const seats: { [index: number]: PublicPlayerClientData } = {};
  const showdownState = gameState.showdown;

  let tableRotation = 0;
  let isJoinedGame = false;
  let canBuyIn = false;

  // First pass: find hero's absolute position to calculate rotation
  Object.values(gameState.publicPlayerDataMapByTablePosition).forEach(
    (playerData) => {
      if (playerData.id === playerId) {
        isJoinedGame = true;
        tableRotation = playerData.tableAbsolutePosition;
        canBuyIn = !!(
          playerData.stack && playerData.stack < gameState.tableConfig.maxBuyin
        );
      }
    }
  );

  // Second pass: populate seats with rotated positions
  Object.values(gameState.publicPlayerDataMapByTablePosition).forEach(
    (playerData) => {
      // Calculate the rotated seat index
      let rotatedSeatIndex =
        (playerData.tableAbsolutePosition - tableRotation + numberOfSeats) %
        numberOfSeats;

      // Create the seat info
      seats[rotatedSeatIndex] = playerData;
    }
  );

  return {
    numberOfSeats,
    seatsMap: seats,
    isJoinedGame,
    canBuyIn,
    showdownState,
  };
};
