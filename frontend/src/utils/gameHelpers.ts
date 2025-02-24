import { Card, GameStateServerBroadcast } from "@patchpatch/shared";

export const constructBoards = (
  flops: Card[][] | null,
  turns: Card[] | null,
  rivers: Card[] | null
) => {
  return (
    flops?.map((flop, index) => {
      const board: Card[] = [...flop];
      if (turns) board.push(turns[index]);
      if (rivers) board.push(rivers[index]);
      return board;
    }) || []
  );
};

export const getPlayerAbsolutePosition = (
  playerId: string | null,
  gameState: GameStateServerBroadcast | null
) => {
  if (!playerId || !gameState) return null;

  const player = gameState.publicPlayerDataMapByTablePosition.find(
    (p) => p.id === playerId
  );

  return player?.tableAbsolotePosition ?? null;
};
