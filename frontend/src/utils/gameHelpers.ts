import { Card } from "@patchpatch/shared";

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
