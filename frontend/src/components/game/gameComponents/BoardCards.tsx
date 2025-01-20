import React from 'react';
import Card from './Card';
import CardObject from '../gameTypes/CardObject';

interface BoardCardsProps {
  boards: CardObject[][];
}

const BoardCards: React.FC<BoardCardsProps> = ({ boards }) => {
  return (
    <>
      {boards.map((board, boardIndex) => (
        <div key={`board-${boardIndex}`} className="board-section">
          <div className="board-label">Board {boardIndex + 1}</div>
          <div className="board">
            {board.map((card, cardIndex) => (
              <Card
                key={`board-${boardIndex}-card-${cardIndex}`}
                card={card}
                className="card"
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default BoardCards;
