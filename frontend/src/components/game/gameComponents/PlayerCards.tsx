import React from 'react';
import Card from '../../utils/Card';

interface PlayerCardsProps {
  playerCards: { rank: string; suit: string }[];
}

const PlayerCards: React.FC<PlayerCardsProps> = ({ playerCards }) => {
  return (
    <>
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
                {cardsForRow.map((card, cardIndex) => (
                  <Card
                    key={`player-board-${rowIndex}-card-${cardIndex}`}
                    card={card}
                    className="card"
                  />
                ))}
              </div>
            </div>
          );
        })}
    </>
  );
};

export default PlayerCards;
