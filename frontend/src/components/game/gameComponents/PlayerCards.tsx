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
    setSelectedCards([]);
    if (gamePhaseArrangeCards) {
      setArrangedCards([...playerCards]);
      setIsArrangementComplete(false);
    } else {
      setArrangedCards([]);
      setIsArrangementComplete(true);
    }
  }, [gamePhaseArrangeCards]);

  // Handle timeout
  useEffect(() => {
    if (gamePhaseArrangeCards && arrangeCardsTimeLeft <= 0) {
      handleArrangementComplete();
    }
  }, [arrangeCardsTimeLeft]);

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
      console.log('Swapping cards:', firstIndex, secondIndex);

      // First perform the swap
      setArrangedCards(prev => {
        const newArrangement = [...prev];
        [newArrangement[firstIndex], newArrangement[secondIndex]] = [
          newArrangement[secondIndex],
          newArrangement[firstIndex],
        ];
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
    setIsArrangementComplete(true);
    onArrangementComplete?.(arrangedCards);
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
          <div className="time-remaining">
            Time remaining: {Math.max(0, arrangeCardsTimeLeft - 0.5)}s
          </div>
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
