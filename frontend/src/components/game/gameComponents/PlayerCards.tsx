import React, { useEffect, useState } from 'react';
import Card from './Card';
import './PlayerCards.css';
import CardObject from '../gameTypes/CardObject';

interface PlayerCardsProps {
  playerCards: CardObject[];
  gamePhaseArrangeCards: boolean;
  arrangeCardsTimeLeft: number;
  onArrangementComplete?: (
    arrangement: { rank: string; suit: string }[]
  ) => void;
}

const PlayerCards: React.FC<PlayerCardsProps> = ({
  playerCards,
  gamePhaseArrangeCards,
  arrangeCardsTimeLeft,
  onArrangementComplete,
}) => {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [arrangedCards, setArrangedCards] = useState<typeof playerCards>([]);
  const [isArrangementComplete, setIsArrangementComplete] = useState(false);

  // Only initialize arranged cards when first receiving cards or when not in arrangement phase
  useEffect(() => {
    if (gamePhaseArrangeCards || arrangedCards.length === 0) {
      setArrangedCards([...playerCards]);
    }
  }, [playerCards, gamePhaseArrangeCards]);

  useEffect(() => {
    setArrangedCards([...playerCards]);
  }, [playerCards]);

  // Handle timeout
  useEffect(() => {
    if (gamePhaseArrangeCards && arrangeCardsTimeLeft <= 0) {
      handleArrangementComplete();
    }
  }, [arrangeCardsTimeLeft]);

  const handleCardClick = (index: number) => {
    if (isArrangementComplete || !gamePhaseArrangeCards) return;

    setSelectedCards(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length < 2) {
        return [...prev, index];
      }
      return prev;
    });
  };

  useEffect(() => {
    if (selectedCards.length === 2) {
      const newArrangement = [...arrangedCards];
      const [firstIndex, secondIndex] = selectedCards;
      [newArrangement[firstIndex], newArrangement[secondIndex]] = [
        newArrangement[secondIndex],
        newArrangement[firstIndex],
      ];

      setArrangedCards(newArrangement);
      setSelectedCards([]);
    }
  }, [selectedCards]);

  const handleArrangementComplete = () => {
    setIsArrangementComplete(true);
    onArrangementComplete?.(arrangedCards);
  };

  return (
    <div className="player-cards-container">
      {gamePhaseArrangeCards && !isArrangementComplete && (
        <div className="arrangement-controls">
          <div className="time-remaining">
            Time remaining: {Math.max(0, arrangeCardsTimeLeft)}s
          </div>
          <button
            onClick={handleArrangementComplete}
            className="ready-button" // bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600
          >
            I'm Ready
          </button>
        </div>
      )}
      {Array(3) // Create 3 rows
        .fill(null)
        .map((_, rowIndex) => {
          const startIndex = rowIndex * 4;
          const cardsForRow = playerCards.slice(startIndex, startIndex + 4);

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
                      className={`card-wrapper ${isSelected ? 'selected' : ''} 
                        ${gamePhaseArrangeCards && !isArrangementComplete ? 'cursor-pointer' : ''}`}
                    >
                      <Card
                        card={card}
                        className={`card ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
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
