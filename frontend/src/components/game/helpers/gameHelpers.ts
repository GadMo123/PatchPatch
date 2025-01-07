import CardObject from '../gameTypes/CardObject';

export const constructBoards = (
  flops: CardObject[][],
  turns: CardObject[],
  rivers: CardObject[]
) => {
  return (
    flops?.map((flop, index) => {
      const board: CardObject[] = [...flop];
      if (turns[index]) board.push(turns[index]);
      if (rivers[index]) board.push(rivers[index]);
      return board;
    }) || []
  );
};
