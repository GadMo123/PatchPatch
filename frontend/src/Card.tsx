// src/components/Card.tsx

import React from 'react';

interface CardProps {
  card: {
    rank: string;
    suit: string;
  };
}

const Card: React.FC<CardProps> = ({ card }) => {
  return (
    <div className="Card">
      {card.rank} of {card.suit}
    </div>
  );
};

export default Card;
