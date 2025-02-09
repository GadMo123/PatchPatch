import React from "react";
import CardView from "../../../components/common/card/CardView";
import "./BoardCards.css";
import { Card } from "@patchpatch/shared";

interface BoardCardsProps {
  boards: Card[][];
}

// Displaying the boards
const BoardCards: React.FC<BoardCardsProps> = ({ boards }) => {
  return (
    <>
      <div className="boards">
        {boards.map((board, boardIndex) => (
          <div key={`board-${boardIndex}`} className="board-section">
            <div className="board-label">Board {boardIndex + 1}</div>
            <div className="board">
              {board.map((card, cardIndex) => (
                <CardView
                  key={`board-${boardIndex}-card-${cardIndex}`}
                  card={card}
                  className="card"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default BoardCards;
