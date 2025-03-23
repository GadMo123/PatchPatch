import React, { useState, useEffect } from "react";
import CardView from "../../../components/common/card/CardView";
import "./BoardCards.css";
import { Card } from "@patchpatch/shared";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider";

interface BoardCardsProps {
  boards: Card[][];
  showdownState?: any; // Add showdown state prop
}

export const HIGHLIGHT_BOARD_EVENT = "highlight-board";

const BoardCards: React.FC<BoardCardsProps> = ({ boards, showdownState }) => {
  const { animationLevel } = useAnimationTheme();
  const [highlightedBoard, setHighlightedBoard] = useState<number | null>(null);

  // Get highlighted board from showdown state or from custom event
  const effectiveHighlightedBoard = showdownState
    ? showdownState.board
    : highlightedBoard;

  useEffect(() => {
    const handleHighlightEvent = (event: CustomEvent) => {
      setHighlightedBoard(event.detail.boardIndex);
    };

    const handleClearHighlightEvent = () => {
      setHighlightedBoard(null);
    };

    window.addEventListener(
      HIGHLIGHT_BOARD_EVENT,
      handleHighlightEvent as EventListener
    );
    window.addEventListener("clear-highlight-board", handleClearHighlightEvent);

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
    <div className={`boards --${animationLevel}`}>
      {boards.map((board, boardIndex) => {
        const isShowdownBoard =
          showdownState && effectiveHighlightedBoard === boardIndex;

        return (
          <div
            key={`board-section-${boardIndex}`}
            className={`board-section --${animationLevel} ${
              effectiveHighlightedBoard === boardIndex ? "highlighted" : ""
            } ${isShowdownBoard ? "showdown-highlighted" : ""}`}
            data-row={boardIndex}
          >
            {board.map(
              (card, cardIndex) =>
                card && (
                  <div
                    key={`board-${boardIndex}-card-${cardIndex}`}
                    className={`board-card --${animationLevel} ${
                      isShowdownBoard ? "showdown-card" : ""
                    }`}
                    style={{
                      gridRow: boardIndex + 1,
                      gridColumn: cardIndex + 1,
                    }}
                  >
                    <CardView
                      card={card}
                      className={`card ${isShowdownBoard ? "showdown-card" : ""}`}
                    />
                  </div>
                )
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BoardCards;
