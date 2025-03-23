import React, { useEffect, useRef, useState } from "react";
import CardView from "../../../components/common/card/CardView";
import "./PlayerCards.css";
import { useGameContext } from "../../../contexts/GameContext";
import { useCountdownTimer } from "../../../hooks/TimerHook";
import { Card } from "@patchpatch/shared";
import { useCardsArrangement } from "../../../hooks/CreateSocketAction";
import { HIGHLIGHT_BOARD_EVENT } from "../../board/BoardCards/BoardCards";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider";

interface PlayerCardsProps {
  playerCards: Card[];
  gamePhaseArrangeCards: boolean;
  arrangeCardsTimeLeft: number;
  showdownState?: any;
}

const PlayerCards: React.FC<PlayerCardsProps> = ({
  playerCards,
  gamePhaseArrangeCards,
  arrangeCardsTimeLeft,
  showdownState,
}) => {
  const { animationLevel } = useAnimationTheme();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [arrangedCards, setArrangedCards] = useState<Card[]>([]);
  const [isArrangementComplete, setIsArrangementComplete] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const timerRef = useRef<number | NodeJS.Timeout | null>(null);

  const { playerId, gameId } = useGameContext();
  const { sendAction } = useCardsArrangement();

  const [timeLeft, cancelTimer] = useCountdownTimer({
    serverTimeRemaining: arrangeCardsTimeLeft,
    onComplete: () => {
      if (gamePhaseArrangeCards && !isArrangementComplete) {
        handleArrangementComplete();
      }
    },
  });

  // Only initialize arranged cards when first receiving cards or when not in arrangement phase
  useEffect(() => {
    setSelectedCards([]);
    if (gamePhaseArrangeCards) {
      setArrangedCards(playerCards);
      setIsArrangementComplete(false);
    } else {
      setArrangedCards([]);
      setIsArrangementComplete(true);
    }
  }, [gamePhaseArrangeCards]);

  const handleCardClick = (index: number) => {
    if (isArrangementComplete || !gamePhaseArrangeCards) return;
    if (selectedCards.includes(index)) {
      setSelectedCards([]);
      return;
    }
    const newSelection = [...selectedCards, index];
    if (newSelection.length === 2) {
      const [firstIndex, secondIndex] = newSelection;
      setArrangedCards((prev) => {
        const newArr = [...prev];
        [newArr[firstIndex], newArr[secondIndex]] = [
          newArr[secondIndex],
          newArr[firstIndex],
        ];
        return newArr;
      });
      setSelectedCards([]);
    } else {
      setSelectedCards(newSelection);
    }
  };

  const handleArrangementComplete = () => {
    if (isArrangementComplete) return;
    if (typeof cancelTimer) cancelTimer();
    sendAction({
      gameId: gameId,
      playerId: playerId,
      arrangement: arrangedCards,
    }).then((response) => {
      if (response.success) {
        setIsArrangementComplete(true);
      } else {
        console.log(response.message);
      }
    });
  };

  const handleRowMouseEnter = (rowIndex: number) => {
    setHoveredRow(rowIndex);
    const highlightEvent = new CustomEvent(HIGHLIGHT_BOARD_EVENT, {
      detail: { boardIndex: rowIndex },
    });
    window.dispatchEvent(highlightEvent);
    timerRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("clear-highlight-board"));
      setHoveredRow(null);
    }, 5000);
  };

  const handleRowMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    window.dispatchEvent(new CustomEvent("clear-highlight-board"));
    setHoveredRow(null);
  };

  const isHighlightedShowdownRow = (rowIndex: number) => {
    return showdownState && showdownState.board === rowIndex;
  };

  const cardsPerRow = 4;
  const rows = [];
  for (let i = 0; i < playerCards.length; i += cardsPerRow) {
    rows.push(playerCards.slice(i, i + cardsPerRow));
  }

  return (
    <div className={`player-cards-container --${animationLevel}`}>
      {rows.map((rowCards, rowIndex) => (
        <div
          key={`player-row-${rowIndex}`}
          className={`player-card-row --${animationLevel} ${
            hoveredRow === rowIndex ? "hovered" : ""
          } ${isHighlightedShowdownRow(rowIndex) ? "showdown-highlight" : ""}`}
          data-row={rowIndex}
          onMouseEnter={() => handleRowMouseEnter(rowIndex)}
          onMouseLeave={handleRowMouseLeave}
        >
          {rowCards.map((card, colIndex) => {
            if (!card) return null;
            const absoluteIndex = rowIndex * cardsPerRow + colIndex;
            const displayCard = isArrangementComplete
              ? playerCards[absoluteIndex]
              : arrangedCards[absoluteIndex] || card;

            return (
              <div
                key={`player-card-${absoluteIndex}`}
                onClick={() => handleCardClick(absoluteIndex)}
                className={`card-wrapper --${animationLevel} ${
                  selectedCards.includes(absoluteIndex) ? "selected" : ""
                }`}
                style={{
                  gridColumn: colIndex + 1,
                }}
              >
                <CardView
                  card={displayCard}
                  className={`card ${
                    selectedCards.includes(absoluteIndex) ? "selected" : ""
                  }`}
                />
              </div>
            );
          })}
          {isHighlightedShowdownRow(rowIndex) &&
            showdownState?.playersHandRank?.some(
              ([id]: [string, string]) => id === playerId
            ) && (
              <div className="hero-hand-rank">
                {
                  showdownState.playersHandRank.find(
                    ([id]: [string, string]) => id === playerId
                  )![1]
                }
              </div>
            )}
        </div>
      ))}
      {gamePhaseArrangeCards && !isArrangementComplete && (
        <div className={`arrangement-controls --${animationLevel}`}>
          {timeLeft > 0 && (
            <div className={`timer --${animationLevel}`}>
              Time left: {timeLeft / 1000}s
            </div>
          )}
          <button
            onClick={handleArrangementComplete}
            className={`ready-button --${animationLevel}`}
          >
            I'm Ready
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerCards;
