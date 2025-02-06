import { Card, GameStateServerBroadcast, Position } from "@patchpatch/shared";
import { PlayerSeatInfo } from "../gameComponents/tableAndSeats/TableAndSeats";

export const constructBoards = (
  flops: Card[][],
  turns: Card[],
  rivers: Card[]
) => {
  return (
    flops?.map((flop, index) => {
      const board: Card[] = [...flop];
      if (turns[index]) board.push(turns[index]);
      if (rivers[index]) board.push(rivers[index]);
      return board;
    }) || []
  );
};

export interface TableProps {
  numberOfSeats: 2 | 3 | 6;
  seats: { [index: number]: PlayerSeatInfo };
  currentPlayerPosition: Position | null;
}

// Fits players data for each seat using the latest gamestate braodcasted:
// If the player is playing in the game (= not an observer) then rotate all positions to fit hero seat into the bottom-center seat while keeping position relative order.
// else if the player is not in the game - use bottom-center-position from server, the server will keep rotating this position every hand to keep a referance for the original order,
// such that positions are turning by one every hand, but the seats of each players remaining constnat (until hero join game and we intreduce a rotation)
export const getTablePropsFromGameState = (
  gameState: GameStateServerBroadcast | null,
  playerId: string
): TableProps | null => {
  if (!gameState || !gameState.publicPlayerDataMapByPosition) return null;

  const numberOfSeats = gameState.tableConfig.maxPlayers as 2 | 3 | 6;
  let currentPlayerPosition: Position | null = null;
  let tableRotation = 0;
  const seats: { [index: number]: PlayerSeatInfo } = {};

  // First pass: find the hero's absolute position to calculate rotation
  Object.values(gameState.publicPlayerDataMapByPosition).forEach(
    (playerData) => {
      if (playerData.id === playerId) {
        tableRotation = playerData.tableAbsolotePosition;
        currentPlayerPosition = playerData.position || null;
      }
    }
  );

  // Second pass: populate seats with rotated positions
  Object.entries(gameState.publicPlayerDataMapByPosition).forEach(
    ([position, playerData]) => {
      // Calculate the rotated seat index
      let rotatedSeatIndex =
        (playerData.tableAbsolotePosition - tableRotation + numberOfSeats) %
        numberOfSeats;

      // Create the seat info
      seats[rotatedSeatIndex] = {
        playerId: playerData.id || null,
        name: playerData.name || null,
        stack: playerData.stack || null,
        position: playerData.position || null,
      };
    }
  );

  return {
    numberOfSeats,
    seats,
    currentPlayerPosition,
  };
};
