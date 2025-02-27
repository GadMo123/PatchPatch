import { Card, GameStateServerBroadcast, Rank, Suit } from "@patchpatch/shared";

export const constructBoards = (
  flops: Object[][] | null | undefined,
  turns: Object[] | null | undefined,
  rivers: Object[] | null | undefined
) => {
  console.log("cons boards", flops);

  return (
    flops?.map((flop, index) => {
      const board = toCardArray(flop as CardLike[]);

      if (turns && turns[index]) board.push(toCard(turns[index] as CardLike));
      if (rivers && rivers[index])
        board.push(toCard(rivers[index] as CardLike));
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

export type CardLike = { _rank: Rank; _suit: Suit } | Card;

export const toCardArray = (cards: CardLike[]): Card[] =>
  cards.map((card) => new Card((card as any)._rank, (card as any)._suit));

export const toCard = (card: CardLike): Card =>
  new Card((card as any)._rank, (card as any)._suit);
