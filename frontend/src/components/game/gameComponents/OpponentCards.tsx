import React from 'react';
import Card from '../../utils/Card';

interface OpponentCardsProps {
  opponents: {
    id: string;
    name: string;
    cards: { rank: string; suit: string }[];
  }[];
}

const OpponentCards: React.FC<OpponentCardsProps> = ({ opponents }) => {
  return (
    <>
      {opponents.map((opponent, index) => (
        <div key={`opponent-${index}`} className="opponent-section">
          <div className="player-name">{opponent.name || 'Villain'}</div>
          <div className="opponent-cards">
            {opponent.cards?.map((card, cardIndex) => (
              <Card
                key={`opponent-${index}-card-${cardIndex}`}
                card={card}
                className="card"
              />
            )) ||
              Array(12)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={`hidden-card-${i}`}
                    className="card card-back"
                    style={{
                      backgroundImage: 'url("/assets/cards/back.png")',
                    }}
                  />
                ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default OpponentCards;
