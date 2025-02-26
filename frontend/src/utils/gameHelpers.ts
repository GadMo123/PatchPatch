import { Card, GameStateServerBroadcast, Rank, Suit } from "@patchpatch/shared";

export const constructBoards = (
  flops: Object[][] | null | undefined,
  turns: Object[] | null | undefined,
  rivers: Object[] | null | undefined
) => {
  console.log("cons boards", flops);

  return (
    flops?.map((flop, index) => {
      const board: Card[] = flop.map(
        (card) => new Card((card as any)._rank, (card as any)._suit)
      );

      if (turns && turns[index])
        board.push(
          new Card((turns[index] as any)._rank, (turns[index] as any)._suit)
        );
      if (rivers && rivers[index])
        board.push(
          new Card((rivers[index] as any)._rank, (rivers[index] as any)._suit)
        );

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
