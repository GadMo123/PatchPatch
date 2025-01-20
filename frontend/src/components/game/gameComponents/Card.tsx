import React from 'react';
import CardObject from '../gameTypes/CardObject';
import './Card.css';

interface CardProps {
  card: CardObject;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, className = '' }) => {
  const suitSrc = `/suits/${card.suit}.svg`;
  return (
    <div className={`container ${card.suit} ${className}`}>
      <div className="upper">
        <div className="upper-rank">{card.rank}</div>
        <img src={suitSrc} alt={card.suit} className="suit-icon" />
      </div>
      <div className="lower">
        <img src={suitSrc} alt={card.suit} className="suit-icon" />
        <div className="rank">{card.rank}</div>
      </div>
    </div>
  );
};

export default Card;
