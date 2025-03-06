import React, { useState, useEffect } from "react";
import CardView from "../../../components/common/card/CardView";
import "./BoardCards.css";
import { Card } from "@patchpatch/shared";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider"; // Adjust path as needed

interface BoardCardsProps {
  boards: Card[][];
}

// Create a custom event for board highlighting
export const HIGHLIGHT_BOARD_EVENT = "highlight-board";

// Displaying the boards
const BoardCards: React.FC<BoardCardsProps> = ({ boards }) => {
  const { animationLevel } = useAnimationTheme();
  const [highlightedBoard, setHighlightedBoard] = useState<number | null>(null);

  // Listen for the custom event to highlight a board
  useEffect(() => {
    const handleHighlightEvent = (event: CustomEvent) => {
      setHighlightedBoard(event.detail.boardIndex);
    };

    const handleClearHighlightEvent = () => {
      setHighlightedBoard(null);
    };

    // Add event listeners
    window.addEventListener(
      HIGHLIGHT_BOARD_EVENT,
      handleHighlightEvent as EventListener
    );
    window.addEventListener("clear-highlight-board", handleClearHighlightEvent);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener(
        HIGHLIGHT_BOARD_EVENT,
        handleHighlightEvent as EventListener
      );
      window.removeEventListener(
        "clear-highlight-board",
        handleClearHighlightEvent
      );
    };
  }, []);

  return (
    <>
      <div className={`boards --${animationLevel}`}>
        {boards.map((board, boardIndex) => (
          <div
            key={`board-${boardIndex}`}
            className={`board-section ${highlightedBoard === boardIndex ? "highlighted" : ""} --${animationLevel}`}
          >
            <div className={`board --${animationLevel}`}>
              {board.map(
                (card, cardIndex) =>
                  card && (
                    <CardView
                      key={`board-${boardIndex}-card-${cardIndex}`}
                      card={card}
                      className="card board-card"
                    />
                  )
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default BoardCards;
