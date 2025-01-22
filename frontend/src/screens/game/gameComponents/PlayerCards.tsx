import React, { useEffect, useState } from 'react';
import Card from './Card';
import './PlayerCards.css';
import { useArrangedCardActions } from '../playerActions/SendPlayerActions';
import { useGameContext } from '../types/GameContext';
import socket from '../../../socket/Socket';
import CardObject from '../types/CardObject';
import { useCountdownTimer } from '../helpers/TimerHook';

interface PlayerCardsProps {
  playerCards: CardObject[];
  gamePhaseArrangeCards: boolean;
  arrangeCardsTimeLeft: number;
}

const PlayerCards: React.FC<PlayerCardsProps> = ({
  playerCards,
  gamePhaseArrangeCards,
  arrangeCardsTimeLeft,
}) => {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [arrangedCards, setArrangedCards] = useState<CardObject[]>([]);
  const [isArrangementComplete, setIsArrangementComplete] = useState(false);

  const { playerId, gameId } = useGameContext();
  const { sendAarrangement: sendAarrangement } = useArrangedCardActions(
    gameId,
    playerId,
    socket
  );

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
      setArrangedCards(playerCards.map(card => ({ ...card })));
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
      // First perform the swap
      setArrangedCards(prev => {
        const newArrangement = [...prev];
        // Make sure to create new object references when swapping
        newArrangement[firstIndex] = { ...prev[secondIndex] };
        newArrangement[secondIndex] = { ...prev[firstIndex] };
        console.log('New arrangement:', newArrangement);
        return newArrangement;
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
    cancelTimer(); // Cancel timer when manual action is taken
    const response = sendAarrangement(
      arrangedCards.map(card => `${card.rank}${card.suit}`)
    );
    setIsArrangementComplete(true);
  };

  const getCardWrapperClassName = (absoluteIndex: number) => {
    const classes = ['card-wrapper'];

    if (gamePhaseArrangeCards && !isArrangementComplete) {
      classes.push('arrangeable');
      if (selectedCards.includes(absoluteIndex)) {
        classes.push('selected');
      }
    } else {
      classes.push('non-arrangeable');
    }

    return classes.join(' ');
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
                      <Card
                        card={card}
                        className={`card ${isSelected ? 'selected' : ''}`}
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
