import React from 'react';
import CardObject from '../game/gameTypes/CardObject';

interface CardProps {
  card: CardObject;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, className = '' }) => {
  let imageName = `${card.rank}${card.suit}.png`;
  console.log('Card received:', card);

  return (
    <div className={`card ${className}`}>
      <img
        src={`/assets/cards/${imageName}`}
        alt={`${card.rank} of ${card.suit}`}
        className="CardImage"
      />
    </div>
  );
};

export default Card;
