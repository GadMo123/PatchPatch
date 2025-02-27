import React, { useEffect, useState } from "react";
import CardView from "../../../components/common/card/CardView";
import "./PlayerCards.css";
import { useGameContext } from "../../../contexts/GameContext";
import { useCountdownTimer } from "../../../hooks/TimerHook";
import { Card } from "@patchpatch/shared";
import { useCardsArrangement } from "../../../hooks/CreateSocketAction";

interface PlayerCardsProps {
  playerCards: Card[];
  gamePhaseArrangeCards: boolean;
  arrangeCardsTimeLeft: number;
}

// Showing player's private cards during a hand, also allowing card arrangement during card-arrangement phase
const PlayerCards: React.FC<PlayerCardsProps> = ({
  playerCards,
  gamePhaseArrangeCards,
  arrangeCardsTimeLeft,
}) => {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [arrangedCards, setArrangedCards] = useState<Card[]>([]);
  const [isArrangementComplete, setIsArrangementComplete] = useState(false);

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
      // If clicking the same card, deselect it
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
      // Then clear the selection
      setSelectedCards([]);
    } else {
      // Just add the new card to selection
      setSelectedCards(newSelection);
    }
  };

  const handleArrangementComplete = () => {
    if (isArrangementComplete) return;
    if (typeof cancelTimer) cancelTimer(); // Cancel timer when manual action is taken
    const response = sendAction({
      gameId: gameId,
      playerId: playerId,
      arrangement: arrangedCards,
    }).then((response) => {
      if (response.success) {
        setIsArrangementComplete(true);
      } else {
        console.log(response.message); // assuming error is the field name based on your Response interface
      }
    });
  };

  const getCardWrapperClassName = (absoluteIndex: number) => {
    const classes = ["card-wrapper"];

    if (gamePhaseArrangeCards && !isArrangementComplete) {
      classes.push("arrangeable");
      if (selectedCards.includes(absoluteIndex)) {
        classes.push("selected");
      }
    } else {
      classes.push("non-arrangeable");
    }

    return classes.join(" ");
  };

  return (
    <div className="player-cards-container">
      {gamePhaseArrangeCards && !isArrangementComplete && (
        <div className="arrangement-controls">
          {timeLeft > 0 && (
            <div className="timer">Time left: {timeLeft / 1000}s</div>
          )}
          <button onClick={handleArrangementComplete} className="ready-button">
            I'm Ready
          </button>
        </div>
      )}
      {Array(3) // Create 3 rows
        .fill(null)
        .map((_, rowIndex) => {
          const startIndex = rowIndex * 4;
          const cardSource = isArrangementComplete
            ? playerCards
            : arrangedCards;
          const cardsForRow = cardSource.slice(startIndex, startIndex + 4);

          return (
            <div key={`player-row-${rowIndex}`} className="player-row">
              <div className="player-board-label">
                Your cards for Board {rowIndex + 1}
              </div>
              <div className="player-cards-row">
                {cardsForRow.map((card, cardIndex) => {
                  const absoluteIndex = startIndex + cardIndex;
                  const isSelected = selectedCards.includes(absoluteIndex);
                  return (
                    <div
                      key={`player-board-${rowIndex}-card-${cardIndex}`}
                      onClick={() => handleCardClick(absoluteIndex)}
                      className={getCardWrapperClassName(absoluteIndex)}
                    >
                      <CardView
                        card={card}
                        className={`card ${isSelected ? "selected" : ""}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default PlayerCards;
