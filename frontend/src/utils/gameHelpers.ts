import { Card } from "@patchpatch/shared";

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
